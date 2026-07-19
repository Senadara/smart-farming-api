const { computeCF, combineCF, diagnosePenyakit } = require('../../../utils/cfHelper');

jest.mock('../../../model/index', () => {
  const mockModel = () => ({ findAll: jest.fn() });
  return {
    Gejala: mockModel(),
    PenyakitGejala: mockModel(),
    PenyakitAyam: mockModel(),
    sequelize: {},
    Sequelize: {},
  };
});

const db = require('../../../model/index');

describe('CF Helper Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('computeCF', () => {
    it('mengembalikan 0.50 jika N <= 1', () => {
      expect(computeCF(1, 1, 'idf')).toBe(0.50);
      expect(computeCF(1, 0, 'idf')).toBe(0.50);
    });

    it('menghitung bobot CF dengan metode IDF (default)', () => {
      // df = 2, n = 10 -> log(10/2) / log(10) = log(5) / 1 => ~0.6989 => dibulatkan ke 0.7
      expect(computeCF(2, 10, 'idf')).toBe(0.70);
    });

    it('menghitung bobot CF dengan metode ratio', () => {
      // df = 2, n = 10 -> 0.9 * (1 - (2 - 1) / 10) = 0.9 * 0.9 = 0.81
      expect(computeCF(2, 10, 'ratio')).toBe(0.81);
    });

    it('membatasi bobot maksimum pada 0.90 dan minimum pada 0.20', () => {
      expect(computeCF(1, 10, 'ratio')).toBe(0.90); // max
      // df = 10, n = 10 (idf) -> log(1) / log(10) = 0
      expect(computeCF(10, 10, 'idf')).toBe(0.20); // min
    });
  });

  describe('combineCF', () => {
    it('menggabungkan dua bobot CF dengan benar', () => {
      // cfLama = 0.5, cfBaru = 0.4 -> 0.5 + 0.4 * (1 - 0.5) = 0.5 + 0.2 = 0.7
      expect(combineCF(0.5, 0.4)).toBe(0.7);
    });
  });

  describe('diagnosePenyakit', () => {
    it('mengembalikan null jika tidak ada knowledge base yang relevan', async () => {
      db.PenyakitGejala.findAll.mockResolvedValue([]);
      const result = await diagnosePenyakit([{ id: 'g-1', cf: 1 }]);
      expect(result).toBeNull();
    });

    it('menghitung skor CF dan mengurutkan hasil diagnosis', async () => {
      db.PenyakitGejala.findAll.mockResolvedValue([
        {
          gejala_id: 'g-1', cf_weight: 0.6,
          penyakit: { id: 'p-1', nama_penyakit: 'Penyakit A' }
        },
        {
          gejala_id: 'g-2', cf_weight: 0.8,
          penyakit: { id: 'p-1', nama_penyakit: 'Penyakit A' }
        },
        {
          gejala_id: 'g-1', cf_weight: 0.5,
          penyakit: { id: 'p-2', nama_penyakit: 'Penyakit B' }
        }
      ]);

      const gejalaInput = [
        { id: 'g-1', cf: 1 },
        { id: 'g-2', cf: 0.5 }
      ];

      const result = await diagnosePenyakit(gejalaInput);

      // P-1:
      // g-1 -> 0.6 * 1 = 0.6
      // g-2 -> 0.8 * 0.5 = 0.4
      // combine(0.6, 0.4) -> 0.6 + 0.4 * 0.4 = 0.76
      
      // P-2:
      // g-1 -> 0.5 * 1 = 0.5
      
      // Hasil akhir tertinggi adalah P-1
      expect(result).not.toBeNull();
      expect(result.id).toBe('p-1');
      expect(result.cf_score).toBeCloseTo(0.76, 2);
      expect(result.persentase).toBeCloseTo(76, 2);
      expect(result.jumlah_gejala_cocok).toBe(2);
    });
  });
});
