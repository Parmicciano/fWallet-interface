import React from "react";
import { Button } from "../index";
import useWeb3Modal from "../../hooks/useWeb3Modal";
import useWalletProvider from "../../hooks/useWalletProvider";

const WalletButton: React.FC<any> = () => {
  const [, loadWeb3Modal, logoutWeb3Modal] = useWeb3Modal();
  const { wallet } = useWalletProvider();

  return (
    <Button
      onClick={() => {
        if (!wallet.account) {
          loadWeb3Modal();
        } else {
          logoutWeb3Modal();
        }
      }}
    >
      {!wallet.account ? "Connect Wallet" : "Disconnect Wallet"}
    </Button>
  );
};

export default WalletButton;
