import "./msgtools.tact";

extends inline fun transfer_with_text(
    self: Address,
    to: Address,
    amount: Int,
    forward_ton: Int,
    gas_transfer: Int,
    query_id: Int,
    text: String
) {
    let b: StringBuilder = beginTailString();
    b.append(text);
    send(SendParameters {
        value: gas_transfer + forward_ton,
        to: self,
        mode: SendIgnoreErrors,
        body: MSGTOOLS__JettonTransfer {
            query_id: query_id,
            amount: amount,
            destination: to,
            response_destination: myAddress(),
            custom_payload: null,
            forward_ton_amount: forward_ton,
            forward_payload: b.toSlice() // TODO: this doesn't show string in block explorer
        }.toCell(),
        bounce: false
    });
}