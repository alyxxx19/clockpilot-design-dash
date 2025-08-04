// Test simple pour valider la configuration Jest
describe('Jest Configuration Test', () => {
  it('should run basic test successfully', () => {
    expect(true).toBe(true);
  });

  it('should handle async operations', async () => {
    const promise = Promise.resolve(42);
    const result = await promise;
    expect(result).toBe(42);
  });

  it('should support modern JavaScript features', () => {
    const array = [1, 2, 3];
    const doubled = array.map(x => x * 2);
    expect(doubled).toEqual([2, 4, 6]);
  });
});