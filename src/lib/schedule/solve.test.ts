import { describe, it, expect } from 'vitest';
import { getGlpk, solveLp } from './solve';

describe('solveLp', () => {
  it('간단한 LP를 최적화한다 (maximize x+y, x<=4, y<=3)', async () => {
    const glpk = await getGlpk();
    const lp = {
      name: 't',
      objective: {
        direction: glpk.GLP_MAX,
        name: 'obj',
        vars: [{ name: 'x', coef: 1 }, { name: 'y', coef: 1 }],
      },
      subjectTo: [
        { name: 'cx', vars: [{ name: 'x', coef: 1 }], bnds: { type: glpk.GLP_UP, ub: 4, lb: 0 } },
        { name: 'cy', vars: [{ name: 'y', coef: 1 }], bnds: { type: glpk.GLP_UP, ub: 3, lb: 0 } },
      ],
    };
    const res = await solveLp(glpk, lp);
    expect(res.result.z).toBeCloseTo(7);
    expect(res.result.vars.x).toBeCloseTo(4);
    expect(res.result.vars.y).toBeCloseTo(3);
  });
});
