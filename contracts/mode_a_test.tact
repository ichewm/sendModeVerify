import "@stdlib/deploy";
import "@stdlib/ownable";
import "./generic_message.tact";
message SetModeB {
    addr: Address;
}

// A Test 是用来发送请求的 用户发送各类 Mode 请求

// 发送消息的模式
// 基本模式
// 0 : 普通消息模式
// 64: SendRemainingValue: 除了新消息中最初指示的值之外，还携带入站消息的所有剩余值。
// 128: SendRemainingBalance: 携带当前智能合约的所有剩余余额，而不是消息中最初指示的值。
// 可选模式
// +1: SendPayGasSeparately: 与消息值分开支付转发费用。
// +2: SendIgnoreErrors: 忽略在操作阶段处理此消息时出现的任何错误。
// +16: SendBounceIfActionFail: 如果在操作阶段出现任何错误，则退回交易。如果标志没有效果 + 2 +2，使用 SendIgnoreErrors。
// +32	SendDestroyIfZero: 如果当前帐户的余额为零，则必须销毁该帐户（通常与模式 128 一起使用 SendRemainingBalance）。

// 验证 使用 64 +2 模式下 B 中余额变动

contract ModeATest with OwnableTransferable, Deployable {
    const STORAGE_GAS_RESERVE: Int = ton("0.2");
    const GAS_MESSAGE_FEE: Int = ton("0.01");

    mode_b: Address;
    owner: Address;
    mark: Int = 0;

    init(owner: Address){
        self.owner = owner;
        self.mode_b = newAddress(0, 0);
    }

    receive("fund gas"){}

    receive(msg: SetModeAddr){
        self.requireOwner();
        self.mode_b = msg.addr;
    }

    receive(msg: SendRemainingValueAndSendIgnoreErrors){
        // 除了新消息中最初指示的值之外，还携带入站消息的所有剩余值 + 正确错误都发送
        self.requireOwner();
        send(SendParameters{
                to: self.mode_b,
                value: 0,
                mode: SendRemainingValue | SendIgnoreErrors,
                body: msg.toCell()
            }
        );
    }

    receive(msg: MarkMessage) {
        require(sender() == self.mode_b, "Unauthenticated sender");
        self.mark = msg.mark;
    }

    receive("withdraw dust") {
        self.requireOwner();

        let dust_to_claim: Int = 0;
        dust_to_claim = myBalance() - self.STORAGE_GAS_RESERVE + self.GAS_MESSAGE_FEE;
        send(SendParameters{
                to: self.owner(),
                value: 0,
                mode: SendRemainingValue | SendIgnoreErrors,
                body: "withdraw dust".asComment()
            }
        );
    }

    get fun my_balance(): Int {
        return myBalance();
    }

    get fun mark(): Int {
        return self.mark;
    }


}