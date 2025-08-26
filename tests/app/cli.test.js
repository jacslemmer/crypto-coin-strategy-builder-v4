import { describe, expect, it, vi } from 'vitest';
import { main } from '../../src/app/cli.js';
describe('cli main', () => {
    it('prints a TradingView URL', () => {
        const log = vi.spyOn(console, 'log').mockImplementation(() => { });
        main();
        expect(log).toHaveBeenCalledTimes(1);
        const arg = log.mock.calls[0][0];
        expect(arg).toContain('https://www.tradingview.com/chart/?');
        expect(arg).toContain('BINANCE%3ABTCUSDT');
        log.mockRestore();
    });
});
//# sourceMappingURL=cli.test.js.map