export const delay = (ms: number) =>
  new Promise((resolver) => setTimeout(resolver, ms));
