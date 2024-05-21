message SendRemainingValueAndSendIgnoreErrors {
    number_of_calculations: Int as uint32;
}

message SendPayGasSeparatelyMessage {
    number_of_calculations: Int as uint32;
}

message MarkMessage {
    mark: Int as uint256;
    extra_data: Slice as remaining;
}

message SetModeAddr {
    addr: Address;
}

message(0xd53276db) MSGTOOLS__JettonExcesses {
    query_id: Int as uint64;
}

message(0xf8a7ea5) MSGTOOLS__JettonTransfer {
    query_id: Int as uint64;
    amount: Int as coins;
    destination: Address;
    response_destination: Address?;
    custom_payload: Cell?;
    forward_ton_amount: Int as coins;
    forward_payload: Slice as remaining;
}

message Count {
    count: Int as uint256;
    amount: Int as coins;
    sender: Address;
}

message SetModeB {
    addr: Address;
}
