type ClassValue = string | number | null | false | undefined | Record<string, boolean | null | undefined> | ClassValue[];

export const cn = (...inputs: ClassValue[]): string => {
  const out: string[] = [];
  const walk = (v: ClassValue) => {
    if (!v) return;
    if (typeof v === 'string' || typeof v === 'number') {
      out.push(String(v));
      return;
    }
    if (Array.isArray(v)) {
      v.forEach(walk);
      return;
    }
    for (const key in v) {
      if (v[key]) out.push(key);
    }
  };
  inputs.forEach(walk);
  return out.join(' ');
};

export const cx = cn;
