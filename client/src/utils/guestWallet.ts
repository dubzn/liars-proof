import { Account, RpcProvider, ec, stark, type AccountInterface, CallData, hash } from "starknet";

const GUEST_WALLET_STORAGE_KEY = "liars_proof_guest_wallet";
const FUNDING_API_URL = "http://daleloco/api";

// OpenZeppelin Account contract class hash
// IMPORTANT: This class hash must exist on your network (ZStarknet)
// You need to find the correct class hash for your network
// Common options:
// - Starknet Sepolia: 0x061dac032f228abef9c6626f995015233097ae253a7f72d68552db02f2971b8f
// - Starknet Mainnet: 0x061dac032f228abef9c6626f995015233097ae253a7f72d68552db02f2971b8f
// - For ZStarknet: You need to find the deployed OZ account class hash
const OZ_ACCOUNT_CLASS_HASH = "0x01484c93b9d6cf61614d698ed069b3c6992c32549194fc3465258c2194734189";

interface GuestWalletData {
  privateKey: string;
  publicKey: string;
  address: string;
  deployed: boolean;
}

/**
 * Generate a new guest wallet with random keypair and compute address
 * Following: https://starknetjs.com/docs/guides/account/create_account
 */
export function generateGuestWallet(): GuestWalletData {
  // Step 1: Generate random private key
  const privateKey = stark.randomAddress();

  // Step 2: Derive public key from private key
  const publicKey = ec.starkCurve.getStarkKey(privateKey);

  // Step 3: Calculate constructor calldata (OpenZeppelin account takes public key as constructor argument)
  const constructorCalldata = CallData.compile({
    publicKey: publicKey,
  });

  // Step 4: Pre-compute the account address
  // This is the address where the account contract will be deployed
  const contractAddress = hash.calculateContractAddressFromHash(
    publicKey, // salt (using public key as salt)
    OZ_ACCOUNT_CLASS_HASH,
    constructorCalldata,
    0, // deployer address (0 means deployed from this account)
  );

  console.log("[GuestWallet] Generated guest wallet:", {
    privateKey: privateKey.substring(0, 10) + "...",
    publicKey: publicKey.substring(0, 10) + "...",
    address: contractAddress,
  });

  return {
    privateKey,
    publicKey,
    address: contractAddress,
    deployed: false,
  };
}

/**
 * Save guest wallet data to localStorage
 */
export function saveGuestWallet(walletData: GuestWalletData): void {
  try {
    localStorage.setItem(GUEST_WALLET_STORAGE_KEY, JSON.stringify(walletData));
    console.log("[GuestWallet] Wallet saved to localStorage:", walletData.address);
  } catch (error) {
    console.error("[GuestWallet] Error saving wallet to localStorage:", error);
    throw new Error("Failed to save guest wallet");
  }
}

/**
 * Load guest wallet data from localStorage
 */
export function loadGuestWallet(): GuestWalletData | null {
  try {
    const stored = localStorage.getItem(GUEST_WALLET_STORAGE_KEY);
    if (!stored) {
      return null;
    }
    const walletData = JSON.parse(stored) as GuestWalletData;
    console.log("[GuestWallet] Wallet loaded from localStorage:", walletData.address);
    return walletData;
  } catch (error) {
    console.error("[GuestWallet] Error loading wallet from localStorage:", error);
    return null;
  }
}

/**
 * Delete guest wallet from localStorage
 */
export function deleteGuestWallet(): void {
  try {
    localStorage.removeItem(GUEST_WALLET_STORAGE_KEY);
    console.log("[GuestWallet] Wallet deleted from localStorage");
  } catch (error) {
    console.error("[GuestWallet] Error deleting wallet from localStorage:", error);
  }
}

/**
 * Request funding for the guest wallet from the API
 */
export async function fundGuestWallet(contractAddress: string): Promise<boolean> {
  try {
    console.log("[GuestWallet] Requesting funds for:", contractAddress);

    const response = await fetch(FUNDING_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        address: contractAddress,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[GuestWallet] Funding failed:", errorText);
      throw new Error(`Funding API returned ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log("[GuestWallet] Funding successful:", result);
    return true;
  } catch (error) {
    console.error("[GuestWallet] Error funding wallet:", error);
    throw error;
  }
}

/**
 * Create an Account instance from guest wallet data
 * Following: https://starknetjs.com/docs/guides/account/create_account
 */
export function createGuestAccount(
  walletData: GuestWalletData,
  provider: RpcProvider,
): AccountInterface {
  // Create Account instance with the pre-computed address
  // starknet.js v8 uses AccountOptions object
  const account = new Account({
    provider: provider,
    address: walletData.address,
    signer: walletData.privateKey,
  });

  console.log("[GuestWallet] Account instance created:", account.address);
  return account;
}

/**
 * Complete flow: create guest wallet, fund it, and return account
 */
export async function setupGuestWallet(
  provider: RpcProvider,
): Promise<{ account: AccountInterface; walletData: GuestWalletData }> {
  try {
    // Check if guest wallet already exists
    let walletData = loadGuestWallet();

    if (walletData) {
      console.log("[GuestWallet] Using existing guest wallet:", walletData.address);
      const account = createGuestAccount(walletData, provider);
      return { account, walletData };
    }

    // Generate new wallet
    console.log("[GuestWallet] Generating new guest wallet...");
    walletData = generateGuestWallet();

    // Create account instance first to get the proper address
    const account = createGuestAccount(walletData, provider);

    // Update wallet data with the account address
    walletData.address = account.address;

    console.log("[GuestWallet] Account address computed:", account.address);

    // Fund the wallet with the computed address
    console.log("[GuestWallet] Funding wallet at address:", account.address);
    // await fundGuestWallet(account.address);

    // Save wallet data with the address
    saveGuestWallet(walletData);

    console.log("[GuestWallet] Guest wallet setup complete:", walletData.address);
    return { account, walletData };
  } catch (error) {
    console.error("[GuestWallet] Error setting up guest wallet:", error);
    throw error;
  }
}

/**
 * Check if a guest wallet exists in localStorage
 */
export function hasGuestWallet(): boolean {
  return loadGuestWallet() !== null;
}

/**
 * Check if an account contract is deployed at the given address
 */
export async function isAccountDeployed(provider: RpcProvider, address: string): Promise<boolean> {
  try {
    await provider.getClassHashAt(address);
    return true;
  } catch (error) {
    // If error contains "Contract not found", the account is not deployed
    return false;
  }
}

/**
 * Deploy the account contract using DEPLOY_ACCOUNT transaction
 */
export async function deployGuestAccount(
  account: AccountInterface,
  walletData: GuestWalletData,
): Promise<{ transaction_hash: string; contract_address: string }> {
  try {
    console.log("[GuestWallet] Deploying account contract at:", account.address);

    // Deploy account using deployAccount method
    const deployAccountPayload = {
      classHash: OZ_ACCOUNT_CLASS_HASH,
      constructorCalldata: CallData.compile({
        publicKey: walletData.publicKey,
      }),
      addressSalt: walletData.publicKey,
    };

    const { transaction_hash, contract_address } = await account.deployAccount(deployAccountPayload);

    console.log("[GuestWallet] Account deployment tx:", transaction_hash);
    console.log("[GuestWallet] Account deployed at:", contract_address);

    // Wait for the transaction to be accepted
    await account.waitForTransaction(transaction_hash);

    console.log("[GuestWallet] Account deployment confirmed");

    // Update wallet data to mark as deployed
    walletData.deployed = true;
    saveGuestWallet(walletData);

    return { transaction_hash, contract_address };
  } catch (error) {
    console.error("[GuestWallet] Error deploying account:", error);
    throw error;
  }
}

/**
 * Ensure the account is deployed before executing transactions
 * If not deployed, deploy it first
 */
export async function ensureAccountDeployed(
  account: AccountInterface,
  provider: RpcProvider,
  walletData: GuestWalletData,
): Promise<void> {
  // Check if already marked as deployed in storage
  if (walletData.deployed) {
    console.log("[GuestWallet] Account already deployed according to storage");
    return;
  }

  // Double-check on-chain
  const isDeployed = await isAccountDeployed(provider, account.address);

  if (isDeployed) {
    console.log("[GuestWallet] Account is already deployed on-chain");
    walletData.deployed = true;
    saveGuestWallet(walletData);
    return;
  }

  // Deploy the account
  console.log("[GuestWallet] Account not deployed, deploying now...");
  await deployGuestAccount(account, walletData);
}
