import { RpcProvider } from 'starknet';

const provider = new RpcProvider({
  nodeUrl: 'https://ztarknet-madara.d.karnot.xyz'
});

try {
  const chainId = await provider.getChainId();
  console.log('Ztarknet Chain ID:', chainId);
} catch (error) {
  console.error('Error:', error.message);
}
