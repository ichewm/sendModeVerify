import "@stdlib/deploy";
import "@stdlib/ownable";
import "./generic_message.tact";
// 用来接收 A mode 的请求, 将执行结果回传给 A
// 有轮询 在逻辑中
// 回复方式多种

contract ModeBTest with OwnableTransferable, Deployable {
    const STORAGE_GAS_RESERVE: Int = ton("0.2");
    const GAS_MESSAGE_FEE: Int = ton("0.01");

    mode_a: Address;
    owner: Address;
    seed: Int;
    mark: Int = 0;

    init(owner: Address, seed: Int) {
        self.owner = owner;
        self.seed = seed;
        self.mode_a = newAddress(0, 0);
    }

    receive("fund gas"){}

    receive(msg: SetModeAddr){
        self.requireOwner();
        self.mode_a = msg.addr;
    }

    receive(msg: SendRemainingValueAndSendIgnoreErrors){
        // 除了新消息中最初指示的值之外，还携带入站消息的所有剩余值 + 正确错误都发送
        require(sender() == self.mode_a, "Unauthenticated sender");
        repeat(msg.number_of_calculations) {
            self.mark = self.mark + 1;
        }

        let extra_data: Builder = beginCell();
        extra_data = extra_data.storeAddress(myAddress());
        extra_data = extra_data.storeUint(self.my_balance() ,64);

        send(SendParameters{
                to: self.mode_a,
                value: 0,
                mode: SendRemainingValue | SendIgnoreErrors,
                body: MarkMessage{ 
                    mark: self.mark,
                    extra_data: beginCell().storeRef(extra_data.endCell()).asSlice()
                }.toCell()
            }
        );
    }

    receive("withdraw dust") {
        self.requireOwner();

        let dust_to_claim: Int = 0;
        dust_to_claim = myBalance() - self.STORAGE_GAS_RESERVE + self.GAS_MESSAGE_FEE;
        send(SendParameters{
                to: self.owner(),
                value: dust_to_claim,
                mode: SendRemainingValue | SendIgnoreErrors,
                body: "withdraw dust".asComment()
            }
        );
    }

    get fun mark(): Int {
        return self.mark;
    }

    get fun my_balance(): Int {
        return myBalance();
    }
}
