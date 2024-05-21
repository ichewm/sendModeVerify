import { getHttpEndpoint, Network } from '@orbs-network/ton-access';
import { mnemonicToWalletKey } from '@ton/crypto';
import { TonClient4, WalletContractV4 } from '@ton/ton';
import { toNano, Address, Sender, OpenedContract, beginCell, Cell, fromNano } from '@ton/core';

import { ModeATest, SendRemainingValueAndSendIgnoreErrors, SetModeAddr } from '../wrappers/ModeATest';
import { ModeBTest } from '../wrappers/ModeBTest';

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

import yargs, { Argv } from 'yargs';
import { hideBin } from 'yargs/helpers';

import { readFile, writeToFile } from './utils';
import { verify } from 'crypto';

dotenv.config();

let adminKey0: { publicKey: any; secretKey: any };
let adminWalletContract0: OpenedContract<WalletContractV4>;
let client: TonClient4;
let adminWalletSender0: Sender;

let seed: bigint = BigInt(1);

// Contract address
let modeATestContract: Address;
let modeBTestContract: Address;

// Redefine console.log to write to a file
const originalConsoleLog = console.log;
console.log = function (message: String) {
    const filePath = `./deploy/output/pixelswap-${configFile}.log`;

    const now = new Date();
    const formattedDate = now.toISOString();

    fs.appendFileSync(filePath, `${formattedDate}: ${message}\n`);
    originalConsoleLog.apply(console, [...arguments]);
};

let configFile: String;
export let config: any;

let current_now = Math.round(Number(new Date()) / 1000);

export function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function todo(fun: any) {
    let complete = false;
    while (!complete) {
        try {
            await fun();
            complete = true;
        } catch (e) {
            //nothing
            console.log(e);
            console.log('Network Err, Retrying...');
        }
        try {
            await initParameter(config.network);
        } catch (e) {
            //nothing
        }
        await sleep(2000);
    }
}

export async function todoValue<T>(fun: () => Promise<T>): Promise<T> {
    let complete = false;
    let result: T | undefined;
    while (!complete) {
        try {
            result = await fun();
            complete = true;
        } catch (e) {
            console.log(e);
            console.log('Network Err, Retrying...');
        }
        try {
            await initParameter(config.network);
        } catch (e) {
            // Ignore initialization errors
        }
        await sleep(2000);
    }
    if (result === undefined) {
        throw new Error('Failed to complete operation');
    }
    return result;
}

export async function initParameter(network: string) {
    adminKey0 = await mnemonicToWalletKey(process.env.ADMIN0!.split(' '));

    const adminKey0Wallet = WalletContractV4.create({ publicKey: adminKey0.publicKey, workchain: 0 });

    if (network === 'mainnet') {
        client = new TonClient4({ endpoint: 'https://mainnet-v4.tonhubapi.com' });
    } else {
        client = new TonClient4({ endpoint: 'https://testnet-v4.tonhubapi.com' });
    }

    adminWalletContract0 = client.open(adminKey0Wallet);

    adminWalletSender0 = adminWalletContract0.sender(adminKey0.secretKey);
}

async function getSeqno(user: OpenedContract<WalletContractV4>): Promise<number> {
    let seqno = await todoValue(async () => {
        return await user.getSeqno();
    });
    return seqno;
}

async function wait(seqno: number, user: OpenedContract<WalletContractV4>) {
    await todo(async () => {
        let currentSeqno = seqno;
        console.log('Waiting for transaction to confirm...');
        while (currentSeqno == seqno) {
            await sleep(1500);
            currentSeqno = await user.getSeqno();
        }
    });
}

async function ConstructModeATestContract(): Promise<OpenedContract<ModeATest>> {
    let contract = await todoValue(async () => {
        const contractAddress = ModeATest.fromAddress(modeATestContract);
        return client.open(contractAddress);
    });
    return contract;
}

async function ConstructModeBTestContract(): Promise<OpenedContract<ModeBTest>> {
    let contract = await todoValue(async () => {
        const contractAddress = ModeBTest.fromAddress(modeBTestContract);
        return client.open(contractAddress);
    });
    return contract;
}




async function deployModeATestContract() {
    console.log('====== Deploying ModeATest Contract ======');
    let seqno: number;

    await todo(async () => {
        seqno = await adminWalletContract0.getSeqno();
    });

    const modeATest = client.open(await ModeATest.fromInit(adminWalletContract0.address, seed));

    await todo(async () => {
        await modeATest.send(
            adminWalletSender0,
            {
                value: toNano('0.5'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            },
        );
    });

    await todo(async () => {
        let currentSeqno = seqno;
        console.log('Waiting for transaction to confirm...');
        while (currentSeqno == seqno) {
            await sleep(1500);
            currentSeqno = await adminWalletContract0.getSeqno();
        }
        console.log('Transaction confirmed!');
    });
    modeATestContract = modeATest.address;
    console.log(`modeATest contract: ${modeATestContract}`);
    writeToFile(
        [modeATestContract.toString()],
        `./deploy/output/${configFile}-modeATestContract.address`,
    );
    console.log('====== Deploying ModeATest Deployed ======');
}


async function deployModeBTestContract() {
    console.log('====== Deploying modeBTest Contract ======');
    let seqno: number;

    await todo(async () => {
        seqno = await adminWalletContract0.getSeqno();
    });

    const modeBTest = client.open(await ModeBTest.fromInit(adminWalletContract0.address, seed));

    await todo(async () => {
        await modeBTest.send(
            adminWalletSender0,
            {
                value: toNano('0.5'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            },
        );
    });

    await todo(async () => {
        let currentSeqno = seqno;
        console.log('Waiting for transaction to confirm...');
        while (currentSeqno == seqno) {
            await sleep(1500);
            currentSeqno = await adminWalletContract0.getSeqno();
        }
        console.log('Transaction confirmed!');
    });
    modeBTestContract = modeBTest.address;
    console.log(`modeBTest contract: ${modeBTestContract}`);
    writeToFile(
        [modeBTestContract.toString()],
        `./deploy/output/${configFile}-modeBTestContract.address`,
    );
    console.log('====== Deploying modeBTest Deployed ======');
}


async function ModeFundGas(contract: OpenedContract<ModeATest> | OpenedContract<ModeBTest>, value: bigint) {
    console.log('====== FundGas start ======');
    console.log(`ModeContract: ${contract.address}`);
    let seqno = await getSeqno(adminWalletContract0);

    await todo(async () => {
        await contract.send(
            adminWalletSender0,
            {
                value: value,
            },
            'fund gas',
        )
    });

    await wait(seqno, adminWalletContract0);
    console.log('Transaction confirmed!');
    console.log('====== FundGas end ======');
}

async function ModeSetModeAddr(contract: OpenedContract<ModeATest> | OpenedContract<ModeBTest>, value: bigint, addr: Address) {
    console.log('====== SetModeAddr start ======');
    console.log(`ModeContract: ${contract.address}`);
    let seqno = await getSeqno(adminWalletContract0);

    await todo(async () => {
        await contract.send(
            adminWalletSender0,
            {
                value: value,
            },
            {
                $$type: "SetModeAddr",
                addr: addr
            },
        )
    });

    await wait(seqno, adminWalletContract0);
    console.log('Transaction confirmed!');
    console.log('====== SetModeAddr end ======');
}


async function ModeASendRemainingValueAndSendIgnoreErrors(contract: OpenedContract<ModeATest>, value: bigint, number_of_calculations: bigint) {
    console.log('====== ModeASendRemainingValueAndSendIgnoreErrors start ======');
    console.log(`ModeContract: ${contract.address}`);
    let seqno = await getSeqno(adminWalletContract0);

    await todo(async () => {
        await contract.send(
            adminWalletSender0,
            {
                value: value,
            },
            {
                $$type: "SendRemainingValueAndSendIgnoreErrors",
                number_of_calculations: number_of_calculations
            },
        )
    });

    await wait(seqno, adminWalletContract0);
    console.log('Transaction confirmed!');
    console.log('====== ModeASendRemainingValueAndSendIgnoreErrors end ======');
}

async function ModeASendPayGasSeparatelyMessage(contract: OpenedContract<ModeATest>, value: bigint, number_of_calculations: bigint) {
    console.log('====== ModeASendPayGasSeparatelyMessage start ======');
    console.log(`ModeContract: ${contract.address}`);
    let seqno = await getSeqno(adminWalletContract0);

    await todo(async () => {
        await contract.send(
            adminWalletSender0,
            {
                value: value,
            },
            {
                $$type: "SendPayGasSeparatelyMessage",
                number_of_calculations: number_of_calculations
            },
        )
    });

    await wait(seqno, adminWalletContract0);
    console.log('Transaction confirmed!');
    console.log('====== ModeASendPayGasSeparatelyMessage end ======');
}

async function ModeMyBalance(name: string, contract: OpenedContract<ModeATest> | OpenedContract<ModeBTest>) {
    console.log('====== MyBalance start ======');
    let balance = await contract.getMyBalance();
    console.log(`${name}: ${contract.address} -> ${balance}`);
    console.log('====== MyBalance end ======');
}

async function ModeMark(name: string, contract: OpenedContract<ModeATest> | OpenedContract<ModeBTest>) {
    console.log('====== Mark start ======');
    let mark = await contract.getMark();
    console.log(`${name}: ${contract.address} -> Mark: ${mark}`);
    console.log('====== Mark end ======');
}



async function main() {
    // Define an interface for the expected arguments
    interface Arguments {
        conf: string;
        step: number;
    }

    interface Config {
        network: string;
    }

    // Parse the command line arguments
    const argv = yargs(hideBin(process.argv))
        .option('conf', {
            alias: 'c',
            describe: 'Configuration JSON file',
            type: 'string',
            demandOption: true, // Makes this argument required
        })
        .option('step', {
            alias: 's',
            describe: 'Step number to execute',
            type: 'number',
            demandOption: true, // Makes this argument required
        })
        .parseSync() as Arguments;

    configFile = path.basename(argv.conf).replace(/\.json$/, '');

    const fullPath = path.resolve(argv.conf);
    const data = fs.readFileSync(fullPath, 'utf8');
    config = JSON.parse(data) as Config;

    console.log(`Deploying using ${argv.conf}. Executing step ${argv.step}.`);

    let getModeATestContract = readFile(
        `./deploy/output/${configFile}-modeATestContract.address`,
    )[0];
    if (getModeATestContract) {
        modeATestContract = Address.parse(getModeATestContract);
        console.log(`modeATestContract: ${modeATestContract}`);
    }

    let getModeBTestContract = readFile(`./deploy/output/${configFile}-modeBTestContract.address`)[0];
    if (getModeBTestContract) {
        modeBTestContract = Address.parse(getModeBTestContract);
        console.log(`modeBTestContract: ${modeBTestContract}`);
    }

    await initParameter(config.network);
    let modeA: OpenedContract<ModeATest>;
    let modeB: OpenedContract<ModeBTest>;
    switch (argv.step) {
        case 1:
            // [Owner]
            await deployModeATestContract();
            break;
        case 2:
            // [Owner]
            await deployModeBTestContract();
            break;
        case 3:
            // [Owner]
            modeA = await ConstructModeATestContract();
            // modeB = await ConstructModeBTestContract();
            await ModeFundGas(modeA, toNano(1));
            // await ModeFundGas(modeB, toNano(1));
            break;
        case 4:
            modeA = await ConstructModeATestContract();
            modeB = await ConstructModeBTestContract();
            await ModeSetModeAddr(modeA, toNano(1), modeB.address);
            await ModeSetModeAddr(modeB, toNano(1), modeA.address);
            break;
        case 5:
            modeA = await ConstructModeATestContract();
            // modeB = await ConstructModeBTestContract();
            await ModeMyBalance("ModeA", modeA);
            // await ModeMyBalance("ModeB", modeB);
            break;
        case 6:
            modeA = await ConstructModeATestContract();
            await ModeASendRemainingValueAndSendIgnoreErrors(modeA, toNano(10), BigInt(30000));
            await ModeMark("modeA", modeA);
            break;
        case 7:
            modeA = await ConstructModeATestContract();
            // await ModeASendPayGasSeparatelyMessage(modeA, toNano(10), BigInt(20000));
            await ModeMark("modeA", modeA);
            break;
        case 999:
            console.log(`ModeA: EQDcg28XwX092SpHdDcDCwxAoDuotpZwtcRGiMNU1xqtwlyg -> ${fromNano(1994283861)}`);
            console.log(`ModeB: EQBCm9UdpYmGCpblMTYyHiTu0jTYZxi7t2WMta51lFgPkSEe -> ${fromNano(1994532692)}`);
            console.log(`ModeA: EQDcg28XwX092SpHdDcDCwxAoDuotpZwtcRGiMNU1xqtwlyg -> ${fromNano(11987111203)}`);
            console.log(`ModeB: EQBCm9UdpYmGCpblMTYyHiTu0jTYZxi7t2WMta51lFgPkSEe -> ${fromNano(1805090953)}`);
            console.log(`ModeA: EQCQ1qBADDEmLMYjF-KhL6Yqb7D7jVXyHagpquuP_rz581GC -> ${fromNano(1993930325)}`);
            console.log(`ModeA: EQCQ1qBADDEmLMYjF-KhL6Yqb7D7jVXyHagpquuP_rz581GC -> ${fromNano(1089211797)}`);
        default:
            console.log('Invalid step. Please use argument --step N.');
    }
}

main();

// npx ts-node ./deploy/deployModeTest.ts --conf ./deploy/mode4.json --step 1
