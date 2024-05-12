import { toNano } from '@ton/core';
import { ModeBTest } from '../wrappers/ModeBTest';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const modeBTest = provider.open(await ModeBTest.fromInit());

    await modeBTest.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(modeBTest.address);

    // run methods on `modeBTest`
}
