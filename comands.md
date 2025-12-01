source mi_entorno/bin/activate


sncast call \
    --contract-address 0x07efb9a2915d94d90bdf6df392bc3244c0dd1d9beb79c0f9a5d34ae99e888094 \
    --function "verify_ultra_starknet_zk_honk_proof" \
    --calldata $(cat calldata.txt)