import { toNano } from '@ton/core';
import { ModeTest } from '../wrappers/ModeATest';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const modeTest = provider.open(await ModeTest.fromInit());

    await modeTest.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(modeTest.address);

    // run methods on `modeTest`
}
