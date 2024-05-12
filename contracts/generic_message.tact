message SendRemainingValueAndSendIgnoreErrors {
    number_of_calculations: Int as uint32;
}

message MarkMessage {
    mark: Int as uint256;
    extra_data: Slice as remaining;
}

message SetModeAddr {
    addr: Address;
}