jest.mock("../../model/index", () => ({
     Gejala: {},
     PenyakitAyam: {},
     PenyakitGejala: { findAll: jest.fn() },
}));

const { computeCF, combineCF, diagnosePenyakit } = require("../cfHelper");
const db = require("../../model/index");

describe("computeCF - bobot CF per gejala", () => {
     describe("guard n <= 1", () => {
          it("n = 1 → 0.50", () => {
               expect(computeCF(1, 1, "idf")).toBeCloseTo(0.5, 2);
          });
          it("n = 0 → 0.50", () => {
               expect(computeCF(1, 0, "idf")).toBeCloseTo(0.5, 2);
          });
     });

     describe('metode "idf" - ln(n/df)/ln(n), n = 10', () => {
          it("df = 1 → 0.90 (clamp atas)", () => {
               expect(computeCF(1, 10, "idf")).toBeCloseTo(0.9, 2);
          });
          it("df = 2 → 0.70", () => {
               expect(computeCF(2, 10, "idf")).toBeCloseTo(0.7, 2);
          });
          it("df = 3 → 0.52", () => {
               expect(computeCF(3, 10, "idf")).toBeCloseTo(0.52, 2);
          });
          it("df = 4 → 0.40", () => {
               expect(computeCF(4, 10, "idf")).toBeCloseTo(0.4, 2);
          });
          it("df = 5 → 0.30", () => {
               expect(computeCF(5, 10, "idf")).toBeCloseTo(0.3, 2);
          });
          it("df = 10 → 0.20 (clamp bawah)", () => {
               expect(computeCF(10, 10, "idf")).toBeCloseTo(0.2, 2);
          });
     });

     describe('metode "ratio" - 0.9*(1-(df-1)/n), n = 10', () => {
          it("df = 1 → 0.90", () => {
               expect(computeCF(1, 10, "ratio")).toBeCloseTo(0.9, 2);
          });
          it("df = 2 → 0.81", () => {
               expect(computeCF(2, 10, "ratio")).toBeCloseTo(0.81, 2);
          });
          it("df = 4 → 0.63", () => {
               expect(computeCF(4, 10, "ratio")).toBeCloseTo(0.63, 2);
          });
          it("df = 5 → 0.54", () => {
               expect(computeCF(5, 10, "ratio")).toBeCloseTo(0.54, 2);
          });
          it("df = 10 → 0.20 (0.09 → clamp bawah)", () => {
               expect(computeCF(10, 10, "ratio")).toBeCloseTo(0.2, 2);
          });
     });

     describe('metode "entropy" - 1 - H/log2(n), n = 10', () => {
          it("df = 2 → 0.70", () => {
               expect(computeCF(2, 10, "entropy")).toBeCloseTo(0.7, 2);
          });
          it("df = 4 → 0.76", () => {
               expect(computeCF(4, 10, "entropy")).toBeCloseTo(0.76, 2);
          });
          it("df = 10 → 0.86", () => {
               expect(computeCF(10, 10, "entropy")).toBeCloseTo(0.86, 2);
          });
     });

     describe("kasus batas & fallback", () => {
          it("metode tidak dikenal → fallback idf: (3,10,'random') = 0.52", () => {
               expect(computeCF(3, 10, "random")).toBeCloseTo(0.52, 2);
          });
          it("n negatif → guard 0.50: (5,-3,'idf')", () => {
               expect(computeCF(5, -3, "idf")).toBeCloseTo(0.5, 2);
          });
          it("df = 0 entropy → H=0 clamp 0.90: (0,10,'entropy')", () => {
               expect(computeCF(0, 10, "entropy")).toBeCloseTo(0.9, 2);
          });
          it("df > n idf → clamp bawah 0.20: (20,10,'idf')", () => {
               expect(computeCF(20, 10, "idf")).toBeCloseTo(0.2, 2);
          });
          it("df = n idf → 0 → clamp 0.20: (2,2,'idf')", () => {
               expect(computeCF(2, 2, "idf")).toBeCloseTo(0.2, 2);
          });
     });
});

describe("combineCF - kombinasi Certainty Factor", () => {
     it("dua CF positif: (0.6, 0.4) = 0.76", () => {
          expect(combineCF(0.6, 0.4)).toBeCloseTo(0.76, 2);
     });
     it("dua CF kuat: (0.8, 0.5) = 0.90", () => {
          expect(combineCF(0.8, 0.5)).toBeCloseTo(0.9, 2);
     });
     it("identitas saat cfLama = 0: (0, 0.7) = 0.70", () => {
          expect(combineCF(0, 0.7)).toBeCloseTo(0.7, 2);
     });
     it("saturasi saat cfLama = 1: (1, 0.3) = 1.00", () => {
          expect(combineCF(1, 0.3)).toBeCloseTo(1.0, 2);
     });
     it("komutatif: (0.6,0.4) = (0.4,0.6)", () => {
          expect(combineCF(0.6, 0.4)).toBeCloseTo(combineCF(0.4, 0.6), 5);
     });
     it("akumulasi via reduce [0.6,0.4,0.5] = 0.88", () => {
          const hasil = [0.6, 0.4, 0.5].reduce((acc, cf) => combineCF(acc, cf), 0);
          expect(hasil).toBeCloseTo(0.88, 2);
     });
});

describe("diagnosePenyakit - diagnosis via knowledge base (DB di-mock)", () => {
     beforeEach(() => {
          db.PenyakitGejala.findAll.mockReset();
     });

     it("memilih penyakit dengan cf_score tertinggi", async () => {
          db.PenyakitGejala.findAll.mockResolvedValue([
               {
                    gejala_id: 1,
                    cf_weight: 0.8,
                    gejala: { nama_gejala: "Lesu" },
                    penyakit: { id: "P1", nama_penyakit: "Newcastle Disease" },
               },
               {
                    gejala_id: 2,
                    cf_weight: 0.85,
                    gejala: { nama_gejala: "Diare" },
                    penyakit: { id: "P1", nama_penyakit: "Newcastle Disease" },
               },
               {
                    gejala_id: 3,
                    cf_weight: 0.5,
                    gejala: { nama_gejala: "Batuk" },
                    penyakit: { id: "P2", nama_penyakit: "Flu Burung" },
               },
          ]);

          const input = [
               { id: 1, cf: 1.0 },
               { id: 2, cf: 0.8 },
               { id: 3, cf: 1.0 },
          ];

          const hasil = await diagnosePenyakit(input);

          expect(hasil.penyakit).toBe("Newcastle Disease");
          expect(hasil.cf_score).toBeCloseTo(0.936, 3);
          expect(hasil.persentase).toBeCloseTo(93.6, 1);
          expect(hasil.jumlah_gejala_cocok).toBe(2);
     });

     it("mengembalikan null saat knowledge base kosong", async () => {
          db.PenyakitGejala.findAll.mockResolvedValue([]);
          const hasil = await diagnosePenyakit([{ id: 99, cf: 1 }]);
          expect(hasil).toBeNull();
     });
});