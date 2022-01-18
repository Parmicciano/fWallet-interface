import Column from "../../components/Column";
import React, { useContext, useEffect, useState } from "react";
import styled, { ThemeContext } from "styled-components";
import OnboardingTopBar from "./OnboardingTopBar";
import Row from "../../components/Row";
import {
  Button,
  ContentBox,
  Heading1,
  Heading2,
  Heading3,
  OverlayButton,
  Typo1,
  Typo2,
  Typo3,
} from "../../components";
import Spacer from "../../components/Spacer";
import walletSymbolImg from "../../assets/img/symbols/WalletBlue.svg";
import keysSymbolImg from "../../assets/img/symbols/Keys.svg";
import checkmarkBlueImg from "../../assets/img/shapes/checkmarkBlue.svg";
import checkmarkGreenImg from "../../assets/img/symbols/GreenCheckMark.svg";
import ledgerImg from "../../assets/img/icons/ledgerBlue.svg";
import metamaskImg from "../../assets/img/icons/metamaskBlue.svg";
import keystoreImg from "../../assets/img/icons/keystoreBlue.svg";
import useModal from "../../hooks/useModal";
import ModalTitle from "../../components/ModalTitle";
import Modal from "../../components/Modal";
import keystoreFileImg from "../../assets/img/icons/keystoreFileIcon.svg";
import mnemonicImg from "../../assets/img/icons/mnemonicIcon.svg";
import pkeyImg from "../../assets/img/icons/privatekeyIcon.svg";
import InputTextBox from "../../components/InputText/InputTextBox";
import { useSoftwareWallet } from "../../hooks/useSoftwareWallet";
import { useDropzone } from "react-dropzone";
import fileIcon from "../../assets/img/icons/fileWhite.svg";
import crossIcon from "../../assets/img/symbols/Cross.svg";
import { useInjectedWallet, useWalletLink } from "../../hooks/useConnectWallet";
import { useWeb3React } from "@web3-react/core";
import { Web3Provider } from "@ethersproject/providers";
import refreshImg from "../../assets/img/symbols/Refresh.svg";
import { useHardwareWallet } from "../../hooks/useHardwareWallet";
import useWalletProvider from "../../hooks/useWalletProvider";
import InfoModal from "../../components/InfoModal";
import useLedgerWatcher from "../../hooks/useLedgerWatcher";

const ConnectPrivateKey: React.FC<any> = ({ onDismiss }) => {
  const { restoreWalletFromPrivateKey } = useSoftwareWallet();
  const [text, setText] = useState("");
  const [error, setError] = useState(null);

  const handleConnect = async () => {
    try {
      await restoreWalletFromPrivateKey(text);
      onDismiss();
    } catch (err) {
      console.error(err);
      setError("Invalid value");
    }
  };

  return (
    <Column style={{ width: "100%", alignItems: "center" }}>
      <Spacer />
      <img style={{ width: "6rem" }} src={pkeyImg} />
      <Spacer />
      <Heading1>Private key</Heading1>
      <Spacer size="xl" />
      <Row style={{ width: "100%" }}>
        <InputTextBox
          error={error}
          setError={setError}
          style={{ width: "100%" }}
          maxLength={66}
          text={text}
          setText={setText}
          placeholder="Enter your private key"
          alignText="center"
        />
      </Row>
      <Spacer />
      <Button
        disabled={text.length !== 66}
        onClick={() => {
          handleConnect();
        }}
        variant="primary"
      >
        Access wallet
      </Button>
      <Spacer />
    </Column>
  );
};

const ConnectMnemonic: React.FC<any> = ({ onDismiss }) => {
  const { color } = useContext(ThemeContext);
  const { restoreWalletFromMnemonic } = useSoftwareWallet();
  const [numOfWords, setNumOfWords] = useState(12);
  const [error, setError] = useState(null);
  const [text, setText] = useState("");

  const handleSetText = (value: string) => {
    const textArray = value.split(" ");
    if (textArray.length > 12) {
      setNumOfWords(24);
    }
    if (numOfWords === 24 && textArray.length < 13) {
      setNumOfWords(12);
    }

    return setText(value);
  };

  const handleConnect = async () => {
    try {
      await restoreWalletFromMnemonic(text);
      onDismiss();
    } catch (err) {
      console.error(err);
      setError("Invalid value");
    }
  };

  return (
    <Column style={{ width: "100%", alignItems: "center" }}>
      <Heading1>Enter your mnemonic phrase</Heading1>
      <Spacer size="xs" />
      <Typo2 style={{ color: color.greys.grey() }}>
        Hit "SPACE" after every successful word entry
      </Typo2>
      <Spacer />
      <InputTextBox
        error={error}
        setError={setError}
        style={{ width: "100%" }}
        text={text}
        setText={handleSetText}
        placeholder="Enter your phrase"
        textArea
        maxLength={false}
      />
      <Row style={{ flexWrap: "wrap", gap: ".5rem", width: "100%" }}>
        {Array(numOfWords)
          .fill("")
          .map((fill, index) => {
            const textArray = text.split(" ");
            return (
              <Row
                key={`mnemonic-input-${index}`}
                style={{
                  width: "24%",
                  height: "4rem",
                  backgroundColor: "#1B283E",
                  borderRadius: "8px",
                  alignItems: "center",
                }}
              >
                <Spacer />
                <Typo2 style={{ color: color.greys.darkGrey() }}>
                  {index + 1}.
                </Typo2>
                <Spacer size="sm" />
                <Typo2 style={{ color: color.white, fontWeight: "bold" }}>
                  {textArray[index] || ""}
                </Typo2>
              </Row>
            );
          })}
      </Row>
      <Spacer size="xl" />
      <Button
        style={{ width: "100%" }}
        variant="primary"
        onClick={() => handleConnect()}
      >
        Access wallet
      </Button>
    </Column>
  );
};

const ConnectKeystoreFile: React.FC<any> = ({ onDismiss }) => {
  const { color } = useContext(ThemeContext);
  const { restoreWalletFromKeystoreFile } = useSoftwareWallet();
  const [fileName, setFileName] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [acceptedFiles, setAcceptedFiles] = useState([]);
  const [fileError, setFileError] = useState(null);
  const [error, setError] = useState(null);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    acceptedFiles: dropzoneAccepted,
    getRootProps: getDropzoneRootProps,
  } = useDropzone({ maxFiles: 1 });

  const {
    acceptedFiles: buttonAccepted,
    getRootProps: getButtonRootProps,
    getInputProps,
  } = useDropzone({ noDrag: true, maxFiles: 1 });

  let reader: any;

  const handleFileRead = (e: any) => {
    try {
      const content = reader.result;
      const json = JSON.parse(content);
      if (json && json?.address && json?.crypto) {
        return setFileContent(content);
      }
      setFileError("Invalid keystore file");
    } catch (err) {
      console.error(err);
      setFileError("Invalid file-type");
    }
  };

  const handleConnect = async () => {
    try {
      setError(null);
      setIsLoading(true);
      await restoreWalletFromKeystoreFile(fileContent, text);
      onDismiss();
    } catch (err) {
      setError(
        err.message
          ? `${err.message[0].toUpperCase()}${err.message.slice(1)}`
          : "Failed to connect"
      );
    } finally {
      setIsLoading(false);
      setText("");
    }
  };

  useEffect(() => {
    setAcceptedFiles([...acceptedFiles, ...dropzoneAccepted]);
  }, [dropzoneAccepted]);
  useEffect(() => {
    setAcceptedFiles([...acceptedFiles, ...buttonAccepted]);
  }, [buttonAccepted]);
  useEffect(() => {
    if (acceptedFiles.length) {
      const file = acceptedFiles[acceptedFiles.length - 1];
      reader = new FileReader();
      reader.onloadend = handleFileRead;
      reader.readAsText(file);
      setFileName(file.path);
    }
  }, [acceptedFiles]);

  return (
    <Column style={{ width: "100%", alignItems: "center" }}>
      <Spacer />
      <img style={{ height: "8rem", width: "8rem" }} src={keystoreFileImg} />
      <Spacer />
      <Heading1>Keystore file</Heading1>
      <Spacer size="xl" />
      {fileContent ? (
        <>
          <ContentBox
            style={{
              padding: "1.5rem 0rem",
              width: "50%",
              backgroundColor: color.primary.black(),
            }}
          >
            <Row
              style={{ width: "100%", alignItems: "center", padding: "0 2rem" }}
            >
              <img src={fileIcon} />
              <Spacer />
              <Typo1 style={{ fontWeight: "bold" }}> {fileName}</Typo1>
              <OverlayButton
                style={{ marginLeft: "auto" }}
                onClick={() => setFileContent(null)}
              >
                <img src={crossIcon} />
              </OverlayButton>
            </Row>
          </ContentBox>
          <Spacer />
          <Row style={{ width: "50%" }}>
            <InputTextBox
              disabled={isLoading}
              style={{ width: "100%" }}
              text={text}
              setText={setText}
              maxLength={null}
              placeholder="Enter password"
              password
            />
          </Row>
          <Spacer size="sm" />
          <Button
            style={{ width: "50%" }}
            disabled={isLoading || !text}
            variant="primary"
            onClick={handleConnect}
          >
            {isLoading ? "Loading wallet..." : "Access wallet"}
          </Button>
          <Spacer size="xs" />
          {error ? (
            <Typo1 style={{ width: "50%", color: "red" }}>{error}</Typo1>
          ) : (
            <Spacer size="sm" />
          )}
        </>
      ) : (
        <>
          <Row
            style={{
              alignItems: "center",
              justifyContent: "center",
              width: "80%",
              height: "8em",
              border: "3px dashed #3A4861",
              borderRadius: "8px",
              fontWeight: "bold",
            }}
            {...getDropzoneRootProps({ className: "dropzone" })}
          >
            <Typo1 style={{ color: color.greys.darkGrey() }}>
              Drop file here
            </Typo1>
          </Row>
          <Spacer />
          <Row
            style={{
              width: "80%",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                width: "47%",
                height: "2px",
                backgroundColor: "#202F49",
              }}
            />
            <Typo1 style={{ fontWeight: "bold", paddingBottom: "2px" }}>
              or
            </Typo1>
            <div
              style={{
                width: "47%",
                height: "2px",
                backgroundColor: "#202F49",
              }}
            />
          </Row>
          <Spacer />
          <Button
            {...getButtonRootProps({ className: "dropzone" })}
            style={{ width: "80%" }}
            variant="primary"
          >
            <input {...getInputProps()} />
            Select file
          </Button>
          <Spacer size="xs" />
          {fileError ? (
            <Typo1 style={{ width: "80%", color: "red" }}>{fileError}</Typo1>
          ) : (
            <Spacer size="sm" />
          )}
        </>
      )}
    </Column>
  );
};

const AccessBySoftwareModal: React.FC<any> = ({ onDismiss, setFlow }) => {
  const { color } = useContext(ThemeContext);
  const [software, setSoftware] = useState(null);
  const [selectedSoftware, setSelectedSoftware] = useState(null);

  const NotRecommended = (
    <ContentBox style={{ backgroundColor: "rgba(248, 66, 57, .15)" }}>
      <Column>
        <Typo2 style={{ fontWeight: "bold" }}>Not recommended</Typo2>
        <Spacer size="sm" />
        <Typo2>
          This is not recommended way to access your wallet. Due to the
          sensitivity of the information involved, these options should only be
          used by experienced users.
        </Typo2>
      </Column>
    </ContentBox>
  );
  const SelectSoftware = (
    <>
      <ModalTitle text="Access by Software" />
      <Column>{NotRecommended}</Column>
      <Spacer size="xl" />
      <Row style={{ width: "100%", justifyContent: "space-between" }}>
        <OverlayButton onClick={() => setSoftware("keystore")}>
          <ContentBox
            style={{
              backgroundColor: color.primary.black(),
              width: "15rem",
              height: "15rem",
              boxSizing: "border-box",
              border: software === "keystore" && "2px solid #1969FF",
            }}
          >
            <Column
              style={{
                width: "100%",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <img src={keystoreFileImg} />
              <Spacer size="sm" />
              <Heading3>Keystore file</Heading3>
            </Column>
          </ContentBox>
        </OverlayButton>
        <OverlayButton onClick={() => setSoftware("mnemonic")}>
          <ContentBox
            style={{
              backgroundColor: color.primary.black(),
              width: "15rem",
              height: "15rem",
              boxSizing: "border-box",
              border: software === "mnemonic" && "2px solid #1969FF",
            }}
          >
            <Column
              style={{
                width: "100%",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <img src={mnemonicImg} />
              <Spacer size="sm" />
              <Heading3>Mnemonic Phrase</Heading3>
            </Column>
          </ContentBox>
        </OverlayButton>
        <OverlayButton onClick={() => setSoftware("pkey")}>
          <ContentBox
            style={{
              backgroundColor: color.primary.black(),
              width: "15rem",
              height: "15rem",
              boxSizing: "border-box",
              border: software === "pkey" && "2px solid #1969FF",
            }}
          >
            <Column
              style={{
                width: "100%",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <img src={pkeyImg} />
              <Spacer size="sm" />
              <Heading3>Private key</Heading3>
            </Column>
          </ContentBox>
        </OverlayButton>
      </Row>
      <Spacer size="xl" />
      <Column style={{ alignItems: "center" }}>
        <Typo2 style={{ color: color.greys.grey() }}>
          Purchase a hardware wallet for the highest security when accessing
          your crypto.
        </Typo2>
        <Spacer size="xs" />
        <OverlayButton>
          <Typo2 style={{ color: color.primary.cyan(), fontWeight: "bold" }}>
            Purchase a hardware wallet
          </Typo2>
        </OverlayButton>
      </Column>
      <Spacer size="xl" />
      <Button
        disabled={!software}
        style={{ width: "100%" }}
        onClick={() => setSelectedSoftware(software)}
        variant="primary"
      >
        Continue
      </Button>
      <Spacer />
    </>
  );

  useEffect(() => {
    return () => setFlow(null);
  }, []);

  return (
    <Modal onDismiss={onDismiss} style={{ width: "50rem" }}>
      {!selectedSoftware && SelectSoftware}
      {selectedSoftware === "pkey" && (
        <ConnectPrivateKey onDismiss={onDismiss} />
      )}
      {selectedSoftware === "mnemonic" && (
        <ConnectMnemonic onDismiss={onDismiss} />
      )}
      {selectedSoftware === "keystore" && (
        <ConnectKeystoreFile onDismiss={onDismiss} />
      )}
    </Modal>
  );
};

const SelectLedgerAccountModal: React.FC<any> = ({
  onDismiss,
  addresses,
  executeOnClose,
}) => {
  const { color } = useContext(ThemeContext);
  const { connectLedger } = useHardwareWallet();
  const [selected, setSelected] = useState(null);
  const [isLoading, setIsLoading] = useState(null);

  useEffect(() => {
    return () => executeOnClose();
  }, []);

  return (
    <Modal onDismiss={onDismiss} style={{ minWidth: "35rem" }}>
      <Heading2>Select ledger account</Heading2>
      <Spacer />
      <ContentBox
        style={{
          width: "90%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: color.primary.black(),
        }}
      >
        {addresses.map((address: string) => {
          const isSelected = selected?.toLowerCase() === address.toLowerCase();
          return (
            <OverlayButton
              key={`address-${address}`}
              onClick={() => setSelected(address)}
            >
              <Typo1 style={{ fontWeight: isSelected ? "bold" : "normal" }}>
                {address}
              </Typo1>
              <Spacer size="xs" />
            </OverlayButton>
          );
        })}
      </ContentBox>
      <Spacer />
      <Button
        variant="primary"
        disabled={!selected || isLoading}
        onClick={() => {
          setIsLoading(true);
          connectLedger(addresses.indexOf(selected))
            .then(onDismiss)
            .finally(() => setIsLoading(false));
        }}
      >
        {isLoading ? "Loading..." : "Continue"}
      </Button>
    </Modal>
  );
};

export const AccessWallet: React.FC<any> = ({ setFlow }) => {
  const { color } = useContext(ThemeContext);
  const { activateInjected } = useInjectedWallet();
  const { activateWalletLink } = useWalletLink();
  // const { activateLedger } = useLedger();
  const { connectLedger, listAddresses } = useHardwareWallet();
  // const { walletContext, dispatchWalletContext } = useWalletProvider();
  const [ledgerAddresses, setLedgerAddresses] = useState([]);
  const [tool, setTool] = useState(null);
  const [selectedTool, setSelectedTool] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const context = useWeb3React<Web3Provider>();
  const [error, setError] = useState(null);

  useLedgerWatcher();

  const [onPresentAccessByKeystoreModal] = useModal(
    <AccessBySoftwareModal setFlow={setFlow} />,
    "access-by-software-modal"
  );

  const [onPresentSelectLedgerAccountModal] = useModal(
    <SelectLedgerAccountModal
      addresses={ledgerAddresses}
      startAccountIndex={0}
      executeOnClose={() => setLedgerAddresses([])}
    />
  );

  useEffect(() => {
    if (ledgerAddresses.length) {
      onPresentSelectLedgerAccountModal();
    }
  }, [ledgerAddresses]);

  useEffect(() => {
    if (context?.error) {
      setError(context.error);
    }
  }, [context.error]);

  // const [onPresentLedgerErrorMessage] = useModal(
  //   <InfoModal
  //     message={
  //       walletContext.hardwareWalletState.isLocked
  //         ? "Ledger is locked. Unlock ledger first."
  //         : walletContext.hardwareWalletState.isWrongApp
  //         ? "Ledger wrong app selected. Connect ledger to FTM APP."
  //         : "Ledger: Unknown error"
  //     }
  //     executeOnClose={() =>
  //       dispatchWalletContext({ type: "setHWInitialState" })
  //     }
  //   />
  // );
  //
  // console.log(walletContext.hardwareWalletState);
  // useEffect(() => {
  //   if (
  //     walletContext.hardwareWalletState.isLocked ||
  //     walletContext.hardwareWalletState.isWrongApp
  //   ) {
  //     onPresentLedgerErrorMessage();
  //   }
  // }, [
  //   walletContext.hardwareWalletState.isLocked,
  //   walletContext.hardwareWalletState.isWrongApp,
  // ]);

  const handleSetTool = (tool: string) => {
    setError(null);
    setSelectedTool(null);
    setTool(tool);
  };

  useEffect(() => {
    if (selectedTool === "ledger") {
      // connectLedger();
      setIsLoading(true);
      listAddresses()
        .then((addresses) => {
          setLedgerAddresses(addresses);
        })
        .finally(() => {
          setIsLoading(false);
          setSelectedTool(null);
        });
    }
    if (selectedTool === "metamask") {
      // loadWeb3Modal();
      activateInjected().finally(() => {
        setSelectedTool(null);
      });
    }
    if (selectedTool === "coinbase") {
      // loadWeb3Modal();
      activateWalletLink().finally(() => {
        setSelectedTool(null);
      });
    }
    if (selectedTool === "keystore") {
      onPresentAccessByKeystoreModal();
      setSelectedTool(null);
    }
  }, [selectedTool]);

  return (
    <Column>
      {selectedTool !== "keystore" && (
        <Column>
          <Spacer size="xxl" />
          <Heading1 style={{ textAlign: "center" }}>
            How do you want to access your wallet?
          </Heading1>
          <Spacer size="xl" />
          <Row style={{ gap: "1rem" }}>
            <OverlayButton onClick={() => handleSetTool("ledger")}>
              <ContentBox
                style={{
                  width: "16rem",
                  height: "16rem",
                  boxSizing: "border-box",
                  border: tool === "ledger" && "2px solid #1969FF",
                }}
              >
                <Column
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <img src={ledgerImg} />
                  <Heading2>Ledger</Heading2>
                </Column>
              </ContentBox>
            </OverlayButton>
            <OverlayButton onClick={() => handleSetTool("metamask")}>
              <ContentBox
                style={{
                  width: "16rem",
                  height: "16rem",
                  boxSizing: "border-box",
                  border: tool === "metamask" && "2px solid #1969FF",
                }}
              >
                <Column
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <img src={metamaskImg} />
                  <Heading2>Metamask</Heading2>
                </Column>
              </ContentBox>
            </OverlayButton>
            <OverlayButton onClick={() => handleSetTool("coinbase")}>
              <ContentBox
                style={{
                  width: "16rem",
                  height: "16rem",
                  boxSizing: "border-box",
                  border: tool === "coinbase" && "2px solid #1969FF",
                }}
              >
                <Column
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <img src={metamaskImg} />
                  <Heading2>Coinbase</Heading2>
                </Column>
              </ContentBox>
            </OverlayButton>
            <OverlayButton onClick={() => handleSetTool("keystore")}>
              <ContentBox
                style={{
                  width: "16rem",
                  height: "16rem",
                  boxSizing: "border-box",
                  border: tool === "keystore" && "2px solid #1969FF",
                }}
              >
                <Column
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <img src={keystoreImg} />
                  <Heading2>Software</Heading2>
                </Column>
              </ContentBox>
            </OverlayButton>
          </Row>
          {/*{ledgerAddresses && ledgerAddresses.length > 0 && (*/}
          {/*  <Column>*/}
          {/*    {ledgerAddresses.map((address: string, addressIndex: number) => (*/}
          {/*      <OverlayButton onClick={() => connectLedger(addressIndex)}>*/}
          {/*        <Typo1>{address}</Typo1>*/}
          {/*      </OverlayButton>*/}
          {/*    ))}{" "}*/}
          {/*  </Column>*/}
          {/*)}*/}
          <Spacer size="xl" />
          <Column style={{ alignSelf: "center", alignItems: "center" }}>
            <Button
              disabled={!tool || isLoading}
              onClick={() => setSelectedTool(tool)}
              style={{ width: "20rem" }}
              variant="primary"
            >
              {isLoading ? "Loading..." : "Continue"}
            </Button>
            {error && (
              <Column style={{ maxWidth: "80%" }}>
                <Spacer />
                <Typo1 style={{ color: "red", textAlign: "center" }}>
                  {error.message}
                </Typo1>
              </Column>
            )}
            <Spacer size="lg" />
            <OverlayButton onClick={() => setFlow(null)}>
              <Typo1
                style={{ fontWeight: "bold", color: color.primary.cyan() }}
              >
                Cancel
              </Typo1>
            </OverlayButton>
            <Spacer size="xl" />
            <Spacer size="xl" />
            <Column
              style={{
                marginTop: "auto",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typo1 style={{ color: color.greys.grey() }}>
                Dont have a wallet?
              </Typo1>
              <Spacer size="sm" />
              <OverlayButton onClick={() => setFlow("newWallet")}>
                <Typo1
                  style={{ fontWeight: "bold", color: color.primary.cyan() }}
                >
                  Create a wallet
                </Typo1>
              </OverlayButton>
            </Column>
          </Column>
        </Column>
      )}
    </Column>
  );
};

const CreateOrAccessWallet: React.FC<any> = ({ setFlow }) => {
  const { color } = useContext(ThemeContext);
  return (
    <Row>
      <ContentBox style={{ width: "20rem" }}>
        <Column style={{ width: "100%" }}>
          <Spacer />
          <img
            style={{ alignSelf: "center", height: "78px", width: "84px" }}
            src={walletSymbolImg}
          />
          <Spacer size="xl" />
          <Heading1>Create a new wallet</Heading1>
          <Spacer />
          <Typo2 style={{ color: color.greys.grey() }}>
            Generate you unique wallet
          </Typo2>
          <Spacer />
          <Typo2 style={{ color: color.greys.grey() }}>
            Receive your own unique public address, and create access and
            recovery credentials.
          </Typo2>
          <Spacer size="xl" />
          <Button
            onClick={() => setFlow("newWallet")}
            style={{
              marginTop: "auto",
              backgroundColor: color.greys.realDarkGrey(),
            }}
            variant="primary"
          >
            Get started
          </Button>
        </Column>
      </ContentBox>
      <Spacer />
      <ContentBox style={{ width: "20rem" }}>
        {" "}
        <Column style={{ width: "100%" }}>
          <Spacer />
          <img
            style={{ alignSelf: "center", height: "78px", width: "84px" }}
            src={keysSymbolImg}
          />
          <Spacer size="xl" />
          <Heading1>Access your wallet</Heading1>
          <Spacer />
          <Typo2 style={{ color: color.greys.grey() }}>
            Connect to the Fantom network and:
          </Typo2>
          <Spacer size="sm" />
          <Row>
            <img src={checkmarkBlueImg} />
            <Spacer size="xs" />
            <Typo2>Send and receive FTM</Typo2>
          </Row>
          <Spacer size="sm" />
          <Row>
            <img src={checkmarkBlueImg} />
            <Spacer size="xs" />
            <Typo2>Stake your FTM</Typo2>
          </Row>
          <Spacer size="sm" />
          <Row>
            <img src={checkmarkBlueImg} />
            <Spacer size="xs" />
            <Typo2>Collect your rewards</Typo2>
          </Row>
          <Spacer size="xl" />
          <Button onClick={() => setFlow("accessWallet")} variant="primary">
            Access now
          </Button>
        </Column>
      </ContentBox>
    </Row>
  );
};

const VerifyMnemonicModal: React.FC<any> = ({
  onDismiss,
  mnemonic,
  setIsVerified,
}) => {
  const { color } = useContext(ThemeContext);
  const [words, setWords] = useState(Array(24).fill(""));
  const [error, setError] = useState(null);
  const handleWordInput = (value: string, index: number) => {
    const updatedWords = [...words];
    updatedWords[index] = value.toLowerCase();

    setWords(updatedWords);
    setError(null);
  };

  const handleVerify = () => {
    if (words.join(" ") === mnemonic) {
      setIsVerified(true);
      return onDismiss();
    }
    setError("Failed to verify mnemonic");
  };

  return (
    <Modal style={{ maxWidth: "760px" }} onDismiss={onDismiss}>
      <ModalTitle text="Verify mnemonic" />
      <Typo2 style={{ color: color.greys.grey() }}>
        Fill in mnemonic phrase below
      </Typo2>
      <Spacer />
      <Column style={{ padding: "0 2rem" }}>
        <Row style={{ flexWrap: "wrap", gap: ".5rem" }}>
          {mnemonic.split(" ").map((mnemonicWord: string, index: number) => {
            return (
              <div key={`mnemnic-${index}`} style={{ width: "24%" }}>
                <InputTextBox
                  text={words[index]}
                  setText={(value: string) => handleWordInput(value, index)}
                  maxLength={null}
                  small={true}
                  pre={`${index + 1}.`}
                />
              </div>
            );
          })}
        </Row>
        <Spacer size="xl" />
        <Button
          disabled={words.findIndex((word) => word === "") !== -1 || error}
          variant="primary"
          onClick={() => handleVerify()}
        >
          Verify
        </Button>
        {error && (
          <>
            <Spacer size="xs" />
            <Typo1
              style={{ color: "red", textAlign: "center", fontWeight: "bold" }}
            >
              {error}
            </Typo1>
          </>
        )}
        <Spacer />
      </Column>
    </Modal>
  );
};

const WalletCreatedModal: React.FC<any> = ({ onDismiss, mnemonic }) => {
  const { createNewWallet } = useSoftwareWallet();
  const handleCreateWallet = () => {
    createNewWallet(mnemonic).then(() => {
      onDismiss();
    });
  };
  const { color } = useContext(ThemeContext);
  return (
    <Modal>
      <Spacer />
      <img src={checkmarkGreenImg} />
      <Spacer />
      <Heading1>Congratulations</Heading1>
      <Spacer size="xs" />
      <Typo2 style={{ color: color.greys.grey() }}>
        It's time to access your fWallet
      </Typo2>
      <Spacer size="xl" />
      <Button
        style={{ width: "100%" }}
        variant="primary"
        onClick={() => handleCreateWallet()}
      >
        Access wallet
      </Button>
      <Spacer size="xl" />
      <Row style={{ flexWrap: "wrap", maxWidth: "70%" }}>
        <Typo3 style={{ color: color.greys.darkGrey(), textAlign: "center" }}>
          By using this application you agree to the{" "}
          <span style={{ color: "white" }}>Terms of Use.</span>
        </Typo3>
      </Row>
    </Modal>
  );
};

const NewWalletWizard: React.FC<any> = () => {
  const { color } = useContext(ThemeContext);
  const { generateMnemonic, createNewWallet } = useSoftwareWallet();
  const [mnemonic, setMnemonic] = useState(generateMnemonic());
  const [acceptRisk, setAcceptRisk] = useState(false);
  const [verified, setIsVerified] = useState(false);
  const [onPresentVerifyModal, setOnPresentVerifyModal] = useModal(
    <VerifyMnemonicModal mnemonic={mnemonic} setIsVerified={setIsVerified} />,
    "verify-mnemonic-modal"
  );
  const [onPresentWalletCreatedModal] = useModal(
    <WalletCreatedModal mnemonic={mnemonic} />,
    "wallet-created-modal"
  );

  useEffect(() => {
    if (verified) {
      onPresentWalletCreatedModal();
    }
  }, [verified]);

  return (
    <Row style={{ gap: "3rem", justifyContent: "center" }}>
      <Column style={{ flex: 2, maxWidth: "644px" }}>
        <ContentBox>
          <Row style={{ flexWrap: "wrap", gap: ".5rem", width: "100%" }}>
            {mnemonic.split(" ").map((fill, index) => {
              const textArray = mnemonic.split(" ");
              return (
                <Row
                  key={`mnemonic-input-${index}`}
                  style={{
                    width: "23.5%",
                    height: "3rem",
                    backgroundColor: "#1B283E",
                    borderRadius: "8px",
                    alignItems: "center",
                  }}
                >
                  <Spacer />
                  <Typo2 style={{ color: color.greys.darkGrey() }}>
                    {index + 1}.
                  </Typo2>
                  <Spacer size="sm" />
                  <Typo2 style={{ color: color.white, fontWeight: "bold" }}>
                    {textArray[index] || ""}
                  </Typo2>
                </Row>
              );
            })}
          </Row>
        </ContentBox>
        <Spacer />
        <ContentBox>
          <Typo2 style={{ color: color.greys.grey() }}>{mnemonic}</Typo2>
        </ContentBox>
        <Spacer />
        <OverlayButton
          onClick={() => {
            setMnemonic(generateMnemonic());
            setAcceptRisk(false);
          }}
        >
          <Row>
            <img src={refreshImg} />
            <Spacer size="xs" />
            <Typo1 style={{ color: color.primary.cyan(), fontWeight: "bold" }}>
              Regenerate
            </Typo1>
          </Row>
        </OverlayButton>
      </Column>
      <Column style={{ flex: 1, maxWidth: "536px" }}>
        <ContentBox style={{ height: "456px" }}>
          <Column>
            <Heading1>This is your key phrase</Heading1>
            <Spacer size="xs" />
            <Typo2 style={{ color: color.greys.grey() }}>
              Use these 24 words in sequential order to recover your fWallet.
            </Typo2>
            <Spacer size="xl" />
            <Spacer size="xl" />
            <Typo1 style={{ color: color.primary.fantomBlue() }}>
              ATTENTION
            </Typo1>
            <Spacer />
            <Typo2 style={{ color: color.greys.grey() }}>
              Store this key phrase in a secure location. Anyone with this key
              phrase can access your fWallet. There is no way to recover lost
              key phrases
            </Typo2>
            <Spacer size="lg" />
            <Row>
              <StyledCheckbox
                name="accept"
                type="checkbox"
                checked={acceptRisk}
                onChange={() => setAcceptRisk(!acceptRisk)}
              />
              <Spacer size="xs" />
              <Typo2 style={{ color: color.greys.grey() }}>
                I wrote down my key phrase in a secure location
              </Typo2>
            </Row>
            <Spacer size="lg" />
            <Button
              disabled={!acceptRisk}
              variant="primary"
              onClick={() => onPresentVerifyModal()}
            >
              Access wallet
            </Button>
          </Column>
        </ContentBox>
      </Column>
    </Row>
  );
};

const StyledCheckbox = styled.input`
  -webkit-appearance: none;
  background-color: transparent;
  width: 1.5rem;
  height: 1.5rem;
  border: 2px solid ${(props) => props.theme.color.primary.cyan()};
  border-radius: 4px;
  display: inline-block;
  position: relative;

  :checked {
    background-color: ${(props) => props.theme.color.primary.cyan()};
  }

  :checked:after {
    content: "\\2714";
    font-size: 1.5rem;
    position: absolute;
    top: -4px;
    left: 0px;
    color: ${(props) => props.theme.color.secondary.navy()};
  }
`;

const CreateNewWallet: React.FC<any> = ({ setFlow }) => {
  const { color } = useContext(ThemeContext);
  const [wizard, setWizard] = useState(false);

  return (
    <Row style={{ justifySelf: "flex-start" }}>
      <Column>
        {wizard ? (
          <NewWalletWizard />
        ) : (
          <>
            <Spacer size="xxl" />
            <Heading1 style={{ textAlign: "center" }}>
              Set up your wallet
            </Heading1>
            <Spacer size="xxl" />
            <ContentBox style={{ width: "20rem" }}>
              <Column>
                <img
                  style={{ alignSelf: "center", height: "78px", width: "84px" }}
                  src={walletSymbolImg}
                />
                <Spacer size="xl" />
                <Typo1
                  style={{
                    color: color.greys.grey(),
                    fontWeight: "bold",
                    padding: "0 3rem",
                    textAlign: "center",
                  }}
                >
                  Generate a new key phrase to setup your fWallet.
                </Typo1>
                <Spacer size="lg" />
                <Button onClick={() => setWizard(true)} variant="primary">
                  Generate key phrase
                </Button>
              </Column>
            </ContentBox>
            <Spacer size="xxl" />
            <OverlayButton onClick={() => setFlow("accessWallet")}>
              <Typo1
                style={{ fontWeight: "bold", color: color.primary.cyan() }}
              >
                Already own a wallet?
              </Typo1>
            </OverlayButton>
          </>
        )}
      </Column>
    </Row>
  );
};

const OnboardingContent: React.FC<any> = ({ contentFlow, setContentFlow }) => {
  return (
    <Column
      style={{ height: "100%", alignItems: "center", justifyContent: "center" }}
    >
      {!contentFlow && <CreateOrAccessWallet setFlow={setContentFlow} />}
      {contentFlow === "accessWallet" && (
        <AccessWallet setFlow={setContentFlow} />
      )}
      {contentFlow === "newWallet" && (
        <CreateNewWallet setFlow={setContentFlow} />
      )}
    </Column>
  );
};

const Onboarding: React.FC<any> = () => {
  const { color } = useContext(ThemeContext);
  const [contentFlow, setContentFlow] = useState(null);
  return (
    <Column style={{ width: "100%" }}>
      <OnboardingTopBar setContentFlow={setContentFlow} />
      <Column
        style={{
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
        }}
      >
        <OnboardingContent
          setContentFlow={setContentFlow}
          contentFlow={contentFlow}
        />
      </Column>
      <Row
        style={{
          padding: "2rem",
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typo2 style={{ color: "#707B8F" }}>
          By using this application you agree to the
        </Typo2>
        <Spacer size="xxs" />
        <Typo2 style={{ color: color.greys.grey() }}>Terms of Use.</Typo2>
      </Row>
    </Column>
  );
};

export default Onboarding;
