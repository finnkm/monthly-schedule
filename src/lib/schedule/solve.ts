import type { LP, Result } from 'glpk.js';

export type GLPKInstance = Awaited<ReturnType<typeof import('glpk.js')['default']>>;
export type { LP, Result };

let instance: Promise<GLPKInstance> | null = null;

export function getGlpk(): Promise<GLPKInstance> {
  if (!instance) {
    instance = import('glpk.js').then((m) => m.default());
  }
  return instance;
}

export async function solveLp(
  glpk: GLPKInstance,
  lp: LP,
  opts?: { tmlim?: number; mipgap?: number },
): Promise<Result> {
  return glpk.solve(lp, {
    msglev: glpk.GLP_MSG_OFF,
    presol: true,
    // 근접 최적해(기본 1%)를 찾으면 조기 종료하여 탐색 시간을 줄인다.
    mipgap: opts?.mipgap ?? 0.01,
    tmlim: opts?.tmlim ?? 20,
  });
}
