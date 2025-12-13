const e = require("express");
const sequelize = require("../model/index");
const db = sequelize.sequelize;
const User = sequelize.User;
const { sendOTP } = require("../config/otpWhatsapp");
const { sendMail, sendResetPasswordMail } = require("../config/sendMail");
const { dataValid } = require("../validation/dataValidation");
const { compare } = require("bcrypt");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../config/jwt");
const { client } = require("../config/redis");
const { generateOTP } = require("../config/otp");
const passport = require("passport");
const { where } = require("sequelize");
const { encrypt } = require("../config/bcrypt");
const Toko = sequelize.Toko;

const login = async (req, res, next) => {
  try {
    const valid = {
      email: "required|email",
      password: "required",
    };

    const user = await dataValid(valid, req.body);

    const data = user.data;

    if (user.message.length > 0) {
      return res.status(400).json({
        error: user.message,
        message: "Login Gagal, silahkan coba lagi",
      });
    }

    const userExist = await User.findOne({
      where: {
        email: data.email,
      },
    });

    if (!userExist) {
      return res.status(400).json({
        status: false,
        message: "Email belum terdaftar",
      });
    }
    if (!(await compare(data.password, userExist.password))) {
      return res.status(400).json({
        status: false,
        message: "Password salah, silahkan coba lagi",
      });
    }

    if (!userExist.isActive) {
      if (userExist.role === "user" || userExist.role === "penjual") {
        return res.status(400).json({
          status: false,
          message: "Email belum diaktifkan",
        });
      }

      return res.status(400).json({
        status: false,
        message: "Akun anda di nonaktifkan, silahkan hubungi admin",
      });
    }

    if (userExist.isDeleted) {
      return res.status(400).json({
        status: false,
        message: "Email sudah dibanned",
      });
    }
    let idAsli = null;
    if (userExist.isActive && userExist.role == "pjawab") {
      idAsli = await Toko.findOne({
        where: {
          TypeToko: "rfc",
        },
        attributes: ["UserId"],
      });
      // console.log("idAsli", idAsli);
    }
    const usr = {
      id: userExist.id,
      name: userExist.name,
      email: userExist.email,
      phone: userExist.phone,
      role: userExist.role,
      avatar: userExist.avatarUrl,
      idAsli: idAsli ? idAsli.UserId : null,
    };

    const token = generateAccessToken(usr);
    const refreshToken = generateRefreshToken(usr);

    return res.status(200).json({
      status: true,
      message: "Login success",
      data: usr,
      token: token,
      refreshToken: refreshToken,
    });
  } catch (error) {
    next(new Error("controller/auth.js:login: " + error.message));
    console.log(error);
  }
};

const register = async (req, res, next) => {
  const t = await db.transaction();

  const valid = {
    name: "required",
    email: "required|email",
    phone: "required|phone",
    password: "required",
    confirmPassword: "required|same:password",
    role: "required|contains:inventor,user,penjual,petugas,pjawab",
  };

  try {
    const user = await dataValid(valid, req.body);
    if (user.message.length > 0) {
      return res.status(400).json({
        error: user.message,
        message: "Registration failed",
      });
    }

    const userExisted = await User.findOne({
      where: {
        email: user.data.email,
      },
    });

    const phoneExisted = await User.findOne({
      where: {
        phone: user.data.phone,
      },
    });

    if (userExisted && userExisted.isDeleted) {
      return res.status(400).json({
        message: "This email has been banned",
      });
    }

    if (userExisted && userExisted.isActive) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    if (
      userExisted &&
      !userExisted.isActive &&
      Date.parse(userExisted.expiredTime) > new Date() &&
      (userExisted.role === "user" || userExisted.role === "penjual")
    ) {
      return res.status(400).json({
        message:
          "Email sudah terdaftar namun belum diaktifkan, silahkan melakukan login untuk mengaktifkan akun",
      });
    }

    if (phoneExisted) {
      return res.status(400).json({
        message:
          "Nomor telepon sudah terdaftar, coba gunakan nomor telepon yang lain",
      });
    }

    if (userExisted) {
      userExisted.destroy({ transaction: t });
    }

    const userData = {
      ...user.data,
      expiredTime: user.data.role === "user" ? new Date() : null,
    };

    if (user.data.role == "user" || user.data.role == "penjual") {
      userData.isActive = false;
    } else {
      userData.isActive = true;
      userData.expiredTime = null;
    }

    const newUser = await User.create(userData, {
      transaction: t,
    });

    let result = false;

    if (newUser.role === "user" || newUser.role === "penjual") {
      const otp = await generateOTP(newUser.id);
      result = await sendOTP(user.data.phone, otp);

      if (result === false) {
        await t.rollback();
        next(new Error("Failed to send OTP"));
      }
    }

    await t.commit();
    return res.status(201).json({
      message: "User created",
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        expiredTime: newUser.expiredTime,
        role: newUser.role,
      },
    });
  } catch (error) {
    await t.rollback();
    next(new Error("controller/auth.js:register: " + error.message));
    console.log(error);
  }
};

const activatePhone = async (req, res, next) => {
  console.log("activatePhone function called");
  try {
    const { phone, otp } = req.body;

    const user = await User.findOne({
      where: {
        phone: phone,
      },
    });

    if (!user) {
      return res.status(200).json({
        status: false,
        message: "Phone number not registered",
      });
    }

    if (user.isActive) {
      return res.status(200).json({
        status: false,
        message: "Phone number already activated",
      });
    }

    if (user.isDeleted) {
      return res.status(200).json({
        status: false,
        message: "Phone number is banned",
      });
    }
    const savedOTP = await client.get(`otp:${user.id}`);

    if (!savedOTP) {
      return res.status(200).json({
        status: false,
        message: "Kode OTP sudah kadaluarsa",
      });
    }

    if (savedOTP !== otp) {
      return res.status(200).json({
        status: false,
        message: "Kode Otp tidak valid",
      });
    }

    await client.del(`otp:${user.id}`);
    user.isActive = true;
    await user.save();

    return res.status(200).json({
      status: true,
      message: "Akun anda telah Aktif",
      data: {
        id: user.id,
        name: user.name,
        phone: user.phone,
      },
    });
  } catch (error) {
    next(new Error("controller/auth.js:activatePhone: " + error.message));
    console.log(error);
  }
};
const resendOtp = async (req, res, next) => {
  try {
    const { phone, email } = req.body;

    var user;

    if (email) {
      user = await User.findOne({
        where: {
          email: email,
        },
      });
    } else {
      user = await User.findOne({
        where: {
          phone: phone,
        },
      });
    }

    if (!user && phone) {
      return res.status(400).json({
        status: false,
        message: "Nomor telepon tidak terdaftar",
      });
    } else if (!user && email) {
      return res.status(400).json({
        status: false,
        message: "Email tidak terdaftar",
      });
    }

    if (user.isDeleted) {
      return res.status(400).json({
        status: false,
        message: "Akun sudah dibanned",
      });
    }

    if (user.isActive && (user.role === "user" || user.role === "penjual")) {
      return res.status(400).json({
        status: false,
        message: "Nomor telepon sudah diaktifkan",
      });
    }

    const otp = await generateOTP(user.id);

    if (email) {
      const result = await sendMail(email, otp);
      if (result == false) {
        return res.status(500).json({
          status: false,
          message: "Email Gagal dikirim, silahkan coba beberapa saat lagi",
        });
      }

      return res.status(200).json({
        status: true,
        message: "Email Berhasil dikirim",
      });
    } else {
      const result = await sendOTP(phone, otp);

      if (result == false) {
        return res.status(500).json({
          status: false,
          message: "OTP Gagal dikirim, silahkan coba beberapa saat lagi",
        });
      }

      return res.status(200).json({
        status: true,
        message: "OTP Berhasil dikirim",
      });
    }
  } catch (error) {
    next(new Error("controller/auth.js:resendOtp: " + error.message));
    console.log(error);
  }
};

const checkOtp = async (req, res, next) => {
  try {
    const { email, phone, otp } = req.body;

    var user;

    if (email) {
      user = await User.findOne({
        where: {
          email: email,
        },
      });
    } else {
      user = await User.findOne({
        where: {
          phone: phone,
        },
      });
    }

    if (!user) {
      return res.status(400).json({
        status: false,
        message: "Email atau nomor telepon tidak terdaftar",
      });
    }
    if (user.isDeleted) {
      return res.status(400).json({
        status: false,
        message: "Akun sudah dibanned",
      });
    }
    if (user.isActive && (user.role === "user" || user.role === "penjual")) {
      return res.status(400).json({
        status: false,
        message: "Akun sudah diaktifkan",
      });
    }
    const savedOTP = await client.get(`otp:${user.id}`);
    if (!savedOTP) {
      return res.status(400).json({
        status: false,
        message: "Kode OTP sudah kadaluarsa",
      });
    }
    if (savedOTP !== otp) {
      return res.status(400).json({
        status: false,
        message: "Kode OTP tidak valid",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Otp Valid",
    });
  } catch (error) {
    next(new Error("controller/auth.js:checkOtp: " + error.message));
    console.log(error);
  }
};

const getPhoneByEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({
      where: {
        email: email,
      },
    });

    if (!user) {
      return res.status(400).json({
        status: false,
        message: "Email not registered",
      });
    }

    if (user.isDeleted) {
      return res.status(400).json({
        status: false,
        message: "Email is banned",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Phone number retrieved successfully",
      data: {
        phone: user.phone,
      },
    });
  } catch (error) {
    next(new Error("controller/auth.js:getPhoneByEmail: " + error.message));
    console.log(error);
  }
};
const activateEmail = async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: {
        email: req.body.email,
      },
    });
    const saved = await client.get(`otp:${user.id}`);

    if (!user) {
      return res.status(400).json({
        message: "Email not registered",
      });
    }

    if (user.isActive) {
      return res.status(400).json({
        message: "Email already activated",
      });
    }

    if (user.isDeleted) {
      return res.status(400).json({
        message: "Email is banned",
      });
    }

    if (!saved) {
      return res.status(400).json({
        message: "OTP expired",
      });
    }

    if (saved !== req.body.otp) {
      return res.status(400).json({
        message: "Wrong OTP",
      });
    }

    await client.del(`otp:${user.id}`);
    user.isActive = true;
    user.expiredTime = null;
    await user.save();
    return res.status(200).json({
      message: "Email activated",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    next(new Error("controller/auth.js:activate: " + error.message));
    console.log(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const headerToken = req.headers["authorization"];
    const token = headerToken && headerToken.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const data = verifyRefreshToken(token);

    if (!data) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const user = await User.findOne({
      where: {
        id: data.id,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (user.isDeleted) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const usr = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatarUrl,
    };

    const newToken = generateAccessToken(usr);
    const newRefreshToken = generateRefreshToken(usr);

    return res.status(200).json({
      message: "Token refreshed",
      data: usr,
      token: newToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    next(new Error("controller/auth.js:refreshToken: " + error.message));
    console.log(error);
  }
};

const forgotPassword = async (req, res, next) => {
  const t = await db.transaction();
  const valid = {
    email: "required|email",
  };
  try {
    const user = await dataValid(valid, req.body);
    if (user.message.length > 0) {
      return res.status(400).json({
        error: user.message,
        message: "Forgot password failed",
      });
    }

    const userExist = await User.findOne({
      where: {
        email: user.data.email,
      },
    });

    if (!userExist) {
      return res.status(400).json({
        status: false,
        message: "Email belum terdaftar",
        data: null,
      });
    }

    if (userExist.isDeleted) {
      return res.status(400).json({
        status: false,
        message: "Email sudah dibanned",
        data: null,
      });
    }

    if (!userExist.isActive) {
      return res.status(400).json({
        status: false,
        message: "Email belum diaktifkan",
        data: null,
      });
    }
    if (userExist.role == "user" || userExist.role == "penjual") {
      const otp = await generateOTP(userExist.id);
      const result = await sendOTP(userExist.phone, otp);
      if (result == false) {
        return res.status(500).json({
          status: false,
          message: "OTP Gagal dikirim, silahkan coba beberapa saat lagi",
          data: null,
        });
      }
      await t.commit();
      return res.status(200).json({
        status: true,
        message: "OTP Berhasil dikirim",
        data: {
          phone: userExist.phone,
        },
      });
    } else {
      const otp = await generateOTP(userExist.id);
      const result = await sendResetPasswordMail(userExist.email, otp);
      if (result == false) {
        return res.status(500).json({
          status: false,
          message: "Email Gagal dikirim, silahkan coba beberapa saat lagi",
          data: null,
        });
      }
      await t.commit();
      return res.status(200).json({
        status: true,
        message: "Email Berhasil dikirim",
        data: {
          email: userExist.email,
        },
      });
    }
  } catch (error) {
    await t.rollback();
    next(new Error("controller/auth.js:forgotPassword: " + error.message));
  }
};

const resetPassword = async (req, res, next) => {
  const t = await db.transaction();
  const valid = {
    email: "required|email",
    password: "required|strongPassword",
    confirmPassword: "required|same:password",
    otp: "required",
  };
  try {
    const user = await dataValid(valid, req.body);
    if (user.message.length > 0) {
      t.rollback();
      return res.status(400).json({
        error: user.message,
        message: user.message[0],
      });
    }

    const userExist = await User.findOne({
      where: {
        email: req.body.email,
      },
    });

    if (!userExist) {
      return res.status(400).json({
        status: false,
        message: "User not found",
        data: null,
      });
    }

    if (userExist.isDeleted) {
      return res.status(400).json({
        status: false,
        message: "Email is banned",
        data: null,
      });
    }

    if (!userExist.isActive) {
      return res.status(400).json({
        status: false,
        message: "Email is not activated",
        data: null,
      });
    }

    const saved = await client.get(`otp:${userExist.id}`);

    if (!saved) {
      return res.status(400).json({
        status: false,
        message: "OTP expired",
        data: null,
      });
    }

    if (saved !== user.data.otp) {
      return res.status(400).json({
        status: false,
        message: "Wrong OTP",
        data: null,
      });
    }

    await client.del(`otp:${userExist.id}`);
    const hashedPassword = await encrypt(user.data.password);
    userExist.password = user.data.password;
    await userExist.save({ transaction: t });
    await t.commit();
    return res.status(200).json({
      status: true,
      message: "Password changed",
      data: {
        id: userExist.id,
        name: userExist.name,
        email: userExist.email,
      },
    });
  } catch (error) {
    await t.rollback();
    next(new Error("controller/auth.js:resetPassword: " + error.message));
  }
};

const googleLogin = async (req, res, next) => {
  return passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    state: "login",
  })(req, res, next);
};

const googleCallback = (req, res, next) => {
  passport.authenticate(
    "google",
    { session: false },
    async (err, googleUser) => {
      let user;
      const state = req.query.state;
      const t = await db.transaction();

      try {
        if (err || !googleUser) {
          console.error(err);
          return res.status(500).json({ message: "Internal server error" });
        }

        user = await User.findOne({
          where: {
            email: googleUser.email,
          },
        });

        if (state == "login" && user) {
          if (user.isDeleted) {
            return res.status(400).json({
              message: "Email is banned",
            });
          }

          if (!user.oAuthStatus) {
            return res.status(400).json({
              message: "Account not linked with Google",
            });
          }

          const usr = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          };

          const token = generateAccessToken(usr);
          const refreshToken = generateRefreshToken(usr);
          return res.status(200).json({
            message: "Login success",
            data: usr,
            token: token,
            refreshToken: refreshToken,
          });
        }

        if (state == "link") {
          user = await User.findOne({
            where: {
              email: googleUser.email,
            },
          });

          if (!user) {
            return res.status(400).json({
              message:
                "The account being used does not match the registered account",
            });
          }

          user.oAuthStatus = true;
          user.avatarUrl = googleUser.avatarUrl;
          await user.save({
            transaction: t,
          });

          await t.commit();
          return res.status(200).json({
            message: "Account linked with Google",
            data: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            },
          });
        }

        user = await User.create(
          {
            name: googleUser.name,
            email: googleUser.email,
            password: null,
            role: "user",
            isActive: true,
            isDeleted: false,
            avatarUrl: googleUser.avatarUrl,
            expiredTime: null,
            oAuthStatus: true,
          },
          {
            transaction: t,
          }
        );

        const token = generateAccessToken({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        });

        const refreshToken = generateRefreshToken({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        });

        await t.commit();
        return res.status(200).json({
          message: "Login success",
          data: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          token: token,
          refreshToken: refreshToken,
        });
      } catch (error) {
        await t.rollback();
        next(new Error("controller/auth.js:googleCallback: " + error.message));
        console.log(error);
      }
    }
  )(req, res, next);
};

const googleRegister = async (req, res, next) => {
  return passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    state: "register",
  })(req, res, next);
};

const googleLink = async (req, res, next) => {
  return passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    state: "link",
  })(req, res, next);
};

const updateFcmToken = async (req, res, next) => {
  try {
    const { fcmToken } = req.body;
    const userId = req.user.id;

    const user = await User.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return res.status(400).json({
        status: false,
        message: "User not found",
      });
    }

    user.fcmToken = fcmToken;
    await user.save();

    return res.status(200).json({
      status: true,
      message: "FCM token updated successfully",
    });
  } catch (error) {
    next(new Error("controller/auth.js:updateFcmToken: " + error.message));
  }
};

module.exports = {
  login,
  register,
  activateEmail,
  activatePhone,
  resendOtp,
  getPhoneByEmail,
  refreshToken,
  forgotPassword,
  resetPassword,
  googleLogin,
  googleCallback,
  googleRegister,
  googleLink,
  updateFcmToken,
  checkOtp,
};
