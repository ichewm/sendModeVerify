import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { fromNano, toNano } from '@ton/core';
import { ModeATest, SendRemainingValueAndSendIgnoreErrors, SetModeAddr } from '../wrappers/ModeATest';
import { ModeBTest } from '../wrappers/ModeBTest';
import '@ton/test-utils';

describe('ModeTest', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let user0: SandboxContract<TreasuryContract>;
    let user1: SandboxContract<TreasuryContract>;
    let modeATest: SandboxContract<ModeATest>;
    let modeBTest: SandboxContract<ModeBTest>;
    let seed: bigint = BigInt(1);

    beforeEach(async () => {
        blockchain = await Blockchain.create();


        deployer = await blockchain.treasury('deployer');
        user0 = await blockchain.treasury('user0');
        user1 = await blockchain.treasury('user1');

        await deployModeA();
        await deployModeB();
    });

    it('0. 测试各合约存款成功.', async () => {
        
        // 1. 查询 A B 合约的余额
        let start_a_balance = await mybalanceTon(modeATest);
        let start_b_balance = await mybalanceTon(modeBTest);
        // 2. 对 A 和 B 合约均存储 10 Ton
        await ModeFundGas(user0, modeATest, toNano(10), true);
        await ModeFundGas(user0, modeBTest, toNano(10), true);
        let end_a_balance = await mybalanceTon(modeATest);
        let end_b_balance = await mybalanceTon(modeBTest);
        // 3. 读取 存款 真实金额
        console.log(`end_a_balance[${fromNano(end_a_balance)}] - start_a_balance[${fromNano(start_a_balance)}] = ${fromNano(end_a_balance-start_a_balance)}`);

        console.log(`end_b_balance[${fromNano(end_b_balance)}] - start_b_balance[${fromNano(start_b_balance)}] = ${fromNano(end_b_balance-start_b_balance)}`);

    });

    it.only('1. A 合约携带 10 Ton 请求 B 合约, 要求 B 合约 Gas 不变.', async () => {
        
        // 1. 查询 A B 合约的余额
        let start_a_balance = await mybalanceTon(modeATest);
        let start_b_balance = await mybalanceTon(modeBTest);
        // 2. 对 A 和 B 合约均存储 10 Ton
        await ModeFundGas(user0, modeATest, toNano(10), true);
        await ModeFundGas(user0, modeBTest, toNano(10), true);
        
        // 3. 给 A B 合约配置互相地址
        await ModeSetModeAddr(deployer, modeATest, toNano(1), {$$type: 'SetModeAddr', addr: modeBTest.address}, true);
        await ModeSetModeAddr(deployer, modeBTest, toNano(1), {$$type: 'SetModeAddr', addr: modeATest.address}, true);

        let end_a_balance = await mybalanceTon(modeATest);
        let end_b_balance = await mybalanceTon(modeBTest);
        // 4. 读取 存款 真实金额
        // console.log(`end_a_balance[${fromNano(end_a_balance)}] - start_a_balance[${fromNano(start_a_balance)}] = ${fromNano(end_a_balance-start_a_balance)}`);

        console.log(`end_b_balance[${fromNano(end_b_balance)}] - start_b_balance[${fromNano(start_b_balance)}] = ${fromNano(end_b_balance-start_b_balance)}`);


        // 5. A 合约 携带 10 Ton 请求 B 合约
        let params: SendRemainingValueAndSendIgnoreErrors = {
            $$type: 'SendRemainingValueAndSendIgnoreErrors',
            number_of_calculations: BigInt(30000)
        }
        await ModeASendRemainingValueAndSendIgnoreErrors(deployer, toNano(10), params, true);

        let end_a_balance_mode = await mybalanceTon(modeATest);
        let end_b_balance_mode = await mybalanceTon(modeBTest);

        // console.log(`end_a_balance[${fromNano(end_a_balance)}] - end_a_balance_mode[${fromNano(end_a_balance_mode)}] = ${fromNano(end_a_balance-end_a_balance_mode)}`);

        console.log(`end_b_balance[${fromNano(end_b_balance)}] - end_b_balance_mode[${fromNano(end_b_balance_mode)}] = ${fromNano(end_b_balance-end_b_balance_mode)}`);
        // 6. 读取 mark 的值
        let markA = await ModeMark(modeATest);
        let markB = await ModeMark(modeBTest);
        console.log(`markA: ${markA} | markB: ${markB}`);
    });

    async function deployModeA() {
        modeATest = blockchain.openContract(await ModeATest.fromInit(deployer.address, seed));
        const deployResult = await modeATest.send(
            deployer.getSender(),
            {
                value: toNano('0.1'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: modeATest.address,
            deploy: true,
            success: true,
        });
    }

    async function deployModeB() {
        modeBTest = blockchain.openContract(await ModeBTest.fromInit(deployer.address, seed));
        const deployResult = await modeBTest.send(
            deployer.getSender(),
            {
                value: toNano('0.1'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: modeBTest.address,
            deploy: true,
            success: true,
        });
    }

    async function mybalanceTon(contract: SandboxContract<ModeATest> | SandboxContract<ModeBTest>): Promise<bigint> {
        return await contract.getMyBalance();
    }

    async function ModeASendRemainingValueAndSendIgnoreErrors(account: SandboxContract<TreasuryContract>, value: bigint, params: SendRemainingValueAndSendIgnoreErrors, success: boolean) {
        let result = await modeATest.send(
            account.getSender(),
            {
                value: value,
            },
            params
        )

        expect(result.transactions).toHaveTransaction({
            from: account.address,
            to: modeATest.address,
            success: success,
        })
    }

    async function ModeSetModeAddr(account: SandboxContract<TreasuryContract>, 
        contract: SandboxContract<ModeATest> | SandboxContract<ModeBTest>, value: bigint, params: SetModeAddr, success: boolean) {
        let result = await contract.send(
            account.getSender(),
            {
                value: value,
            },
            params
        )

        expect(result.transactions).toHaveTransaction({
            from: account.address,
            to: contract.address,
            success: success,
        })
    }

    async function ModeFundGas(account: SandboxContract<TreasuryContract>, contract: SandboxContract<ModeATest> | SandboxContract<ModeBTest>, value: bigint, success: boolean) {
        let result = await contract.send(
            account.getSender(),
            {
                value: value,
            },
            "fund gas"
        )

        expect(result.transactions).toHaveTransaction({
            from: account.address,
            to: contract.address,
            success: success,
        })
    }

    async function ModeMark(contract: SandboxContract<ModeATest> | SandboxContract<ModeBTest>): Promise<bigint> {
        return await contract.getMark();
    }


});
