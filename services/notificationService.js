const { admin, firebaseApp } = require("../src/config/firebaseAdmin");
const sequelize = require("../src/model/index");
const User = sequelize.User;
const { Op } = require("sequelize");

function stringifyDataPayload(dataPayload = {}) {
  const stringDataPayload = {};

  for (const key in dataPayload) {
    if (Object.prototype.hasOwnProperty.call(dataPayload, key)) {
      stringDataPayload[key] = String(dataPayload[key]);
    }
  }

  return stringDataPayload;
}

function invalidTokenCodes() {
  return [
    "messaging/invalid-registration-token",
    "messaging/registration-token-not-registered",
  ];
}

async function removeInvalidToken(token) {
  try {
    await User.update({ fcmToken: null }, { where: { fcmToken: token } });
    console.log(`Invalid FCM token removed: ${token}`);
  } catch (err) {
    console.error(`Error removing invalid FCM token ${token}:`, err);
  }
}

async function handleMulticastFailures(response, tokens) {
  const failedTokensInfo = [];
  const invalidTokens = [];

  response.responses.forEach((resp, idx) => {
    if (!resp.success) {
      const failedToken = tokens[idx];
      const errorCode = resp.error?.code;

      failedTokensInfo.push({
        token: failedToken,
        error: resp.error?.message,
        code: errorCode,
      });

      if (invalidTokenCodes().includes(errorCode)) {
        invalidTokens.push(failedToken);
      }
    }
  });

  if (invalidTokens.length > 0) {
    await Promise.all(invalidTokens.map(removeInvalidToken));
  }

  return failedTokensInfo;
}

function notificationUnavailableResult() {
  return {
    success: false,
    successCount: 0,
    failureCount: 0,
    error: "Firebase Admin SDK not initialized",
  };
}

async function sendNotificationToUser(
  targetRole,
  title,
  body,
  dataPayload = {}
) {
  if (!firebaseApp) {
    console.error("Firebase Admin SDK not initialized. Notification not sent.");
    return notificationUnavailableResult();
  }

  let usersWithToken;

  try {
    if (targetRole != "all") {
      usersWithToken = await User.findAll({
        where: {
          role: targetRole,
          fcmToken: {
            [Op.not]: null,
            [Op.ne]: "",
          },
        },
        attributes: ["fcmToken"],
      });
    } else {
      usersWithToken = await User.findAll({
        where: {
          fcmToken: {
            [Op.not]: null,
            [Op.ne]: "",
          },
        },
        attributes: ["fcmToken"],
      });
    }

    const tokens = usersWithToken
      .map((user) => user.fcmToken)
      .filter((token) => token);

    if (tokens.length === 0) {
      console.log(
        `No users found with role "${targetRole}" and valid FCM tokens. Notification for "${title}" not sent.`
      );
      return {
        success: false,
        successCount: 0,
        failureCount: 0,
        totalCount: 0,
        targetRole,
        error: "No users with valid FCM token",
      };
    }

    const message = {
      notification: {
        title: title,
        body: body,
      },
      data: stringifyDataPayload(dataPayload),
      tokens: tokens,
      android: {
        priority: "high",
        notification: {
          sound: "default",
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(
      `${response.successCount} messages were sent successfully to role "${targetRole}" for title: "${title}".`
    );

    let failedTokensInfo = [];
    if (response.failureCount > 0) {
      failedTokensInfo = await handleMulticastFailures(response, tokens);
      console.error(
        `Failed to send ${response.failureCount} messages. Details:`,
        JSON.stringify(failedTokensInfo, null, 2)
      );
    }

    return {
      success: response.successCount > 0,
      successCount: response.successCount,
      failureCount: response.failureCount,
      totalCount: tokens.length,
      targetRole,
      failures: failedTokensInfo,
    };
  } catch (error) {
    console.error(
      `Error in sendNotificationToRole for role "${targetRole}", title "${title}":`,
      error
    );
    return {
      success: false,
      successCount: 0,
      failureCount: 0,
      targetRole,
      error: error.message,
    };
  }
}
async function sendNotificationToSingleUserById(userId, title, body, dataPayload = {}) {
  if (!firebaseApp) {
    console.error("Firebase Admin SDK not initialized. Notification not sent.");
    return notificationUnavailableResult();
  }

  let token = null;

  try {
    const user = await User.findOne({
      where: {
        id: userId,
        fcmToken: { 
          [Op.not]: null,
          [Op.ne]: "",
        },
      },
      attributes: ["fcmToken"],
    });

    if (!user || !user.fcmToken) {
      console.log(
        `User with ID "${userId}" not found or has no valid FCM token. Notification for "${title}" not sent.`
      );
      return { success: false, error: "User not found or no FCM token" };
    }

    token = user.fcmToken;

    const message = {
      notification: {
        title: title,
        body: body,
      },
      data: stringifyDataPayload(dataPayload),
      token: token,
      android: {
        priority: "high",
        notification: {
          sound: "default",
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log(
      `Successfully sent message to user ${userId} for title: "${title}":`,
      response
    );

    return { success: true, messageId: response }; 

  } catch (error) {
    if (token && invalidTokenCodes().includes(error.code)) {
      await removeInvalidToken(token);
    }

    console.error(
      `Error in sendNotificationToSingleUserById for userId "${userId}", title "${title}":`,
      error
    );
    return { success: false, error: error.message, code: error.code };
  }
}

async function sendNotificationToTarget(target, title, body, dataPayload = {}) {
  const normalizedTarget = target || {};

  if (normalizedTarget.userId) {
    return sendNotificationToSingleUserById(
      normalizedTarget.userId,
      title,
      body,
      dataPayload
    );
  }

  if (normalizedTarget.role) {
    return sendNotificationToUser(normalizedTarget.role, title, body, dataPayload);
  }

  if (normalizedTarget.all === true || normalizedTarget.type === "all") {
    return sendNotificationToUser("all", title, body, dataPayload);
  }

  return {
    success: false,
    error: "Notification target must include userId, role, or all=true",
  };
}

module.exports = {
  sendNotificationToUser,
  sendNotificationToSingleUserById,
  sendNotificationToTarget,

};
