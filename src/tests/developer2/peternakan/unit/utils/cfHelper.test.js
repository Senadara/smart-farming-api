jest.mock('../../../../../model/index', () => ({
  Gejala: {},
  PenyakitGejala: {
    findAll: jest.fn(),
  },
  PenyakitAyam: {},
}));

const { computeCF, combineCF, diagnosePenyakit } = require('../../../../../utils/cfHelper');
const sequelize = require('../../../../../model/index');

describe('cfHelper', () => {
  describe('computeCF', () => {
    it('harus ngembaliin 0.5 kalau penyakitnya cuma satu', () => {
      expect(computeCF(1, 1)).toBe(0.5);
      expect(computeCF(2, 1)).toBe(0.5);
    });

    it('harus ngikutin formula IDF lalu dikunci di range 0.2 sampai 0.9', () => {
      expect(computeCF(1, 4)).toBe(0.9);
      expect(computeCF(2, 4)).toBe(0.5);
      expect(computeCF(3, 4)).toBe(0.21);
    });

    it('harus ngitung ratio sesuai metode ratio', () => {
      expect(computeCF(1, 4, 'ratio')).toBe(0.9);
      expect(computeCF(4, 4, 'ratio')).toBe(0.23);
    });

    it('harus ngitung entropy sesuai metode entropy', () => {
      expect(computeCF(1, 4, 'entropy')).toBe(0.9);
      expect(computeCF(2, 4, 'entropy')).toBe(0.5);
    });
  });

  describe('combineCF', () => {
    it('harus ngombinasiin nilai CF lama dan baru dengan rumus yang konsisten', () => {
      expect(combineCF(0, 0.6)).toBe(0.6);
      expect(combineCF(0.5, 0.4)).toBe(0.7);
      expect(combineCF(0.8, 0.2)).toBeCloseTo(0.84, 2);
    });
  });

  describe('diagnosePenyakit', () => {
    beforeEach(() => {
      sequelize.PenyakitGejala.findAll.mockReset();
    });

    it('harus ngembaliin penyakit dengan skor tertinggi dari gejala yang cocok', async () => {
      // Given: dua penyakit dengan bobot berbeda dan gejala input yang valid
      const knowledgeBase = [
        {
          gejala_id: 'g1',
          cf_weight: '0.80',
          penyakit: { id: 'p1', nama_penyakit: 'Penyakit A' },
        },
        {
          gejala_id: 'g2',
          cf_weight: '0.90',
          penyakit: { id: 'p1', nama_penyakit: 'Penyakit A' },
        },
        {
          gejala_id: 'g1',
          cf_weight: '0.50',
          penyakit: { id: 'p2', nama_penyakit: 'Penyakit B' },
        },
      ];

      sequelize.PenyakitGejala.findAll.mockResolvedValue(knowledgeBase);

      // When: diagnosis dijalankan
      const hasil = await diagnosePenyakit([
        { id: 'g1', cf: 1 },
        { id: 'g2', cf: 0.5 },
      ]);

      // Then: penyakit dengan skor tertinggi harus keluar paling atas
      expect(sequelize.PenyakitGejala.findAll).toHaveBeenCalledTimes(1);
      expect(hasil).toEqual({
        id: 'p1',
        penyakit: 'Penyakit A',
        cf_score: 0.89,
        persentase: 89,
        jumlah_gejala_cocok: 2,
      });
    });

    it('harus ngembaliin null kalau knowledge base kosong', async () => {
      sequelize.PenyakitGejala.findAll.mockResolvedValue([]);

      const hasil = await diagnosePenyakit([{ id: 'g1', cf: 1 }]);

      expect(hasil).toBeNull();
    });
  });
});