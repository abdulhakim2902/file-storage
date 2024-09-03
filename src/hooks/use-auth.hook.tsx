import { HttpAgent, Identity } from "@dfinity/agent";
import { AssetManager } from "@dfinity/assets";
import { AuthClient } from "@dfinity/auth-client";
import {
  createContext,
  FC,
  ReactNode,
  useEffect,
  useState,
  useContext,
} from "react";

const isLocal = process.env.DFX_NETWORK !== "ic";
const canisterId = process.env.CANISTER_ID || "";

type AuthValues = {
  isLogin: boolean;

  assetManager?: AssetManager;
  identity?: Identity;

  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthValues | null>(null);

type Props = {
  children: ReactNode;
};

export const AuthProvider: FC<Props> = ({ children }) => {
  const [isLogin, setIsLogin] = useState(false);
  const [authClient, setAuthClient] = useState<AuthClient>();
  const [assetManager, setAssetManager] = useState<AssetManager>();
  const [identity, setIdentity] = useState<Identity>();

  useEffect(() => {
    AuthClient.create().then(updateClient);
    /* eslint-disable react-hooks/exhaustive-deps*/
  }, []);

  const updateClient = async (client: AuthClient) => {
    const isLogin = await client.isAuthenticated();
    const identity = client.getIdentity();
    const principal = identity.getPrincipal();

    if (isLogin) {
      const agent = HttpAgent.createSync({
        host: isLocal
          ? `http://127.0.0.1:${window.location.port}`
          : "https://ic0.app",
        identity,
      });

      if (isLocal) {
        await agent.fetchRootKey();
      }

      const assetManager = new AssetManager({ canisterId, agent });

      setAssetManager(assetManager);
    }

    console.log(principal.toString());

    setAuthClient(client);
    setIdentity(identity);
    setIsLogin(isLogin);
  };

  const login = async () => {
    if (authClient) {
      let identityProvider;

      const isSafari = /^((?!chrome|android).)*safari/i.test(
        navigator.userAgent,
      );

      if (isLocal) {
        if (isSafari) {
          identityProvider = `http://localhost:4943/?canisterId=${process.env.CANISTER_ID_INTERNET_IDENTITY}`;
        } else {
          identityProvider = `http://${process.env.CANISTER_ID_INTERNET_IDENTITY}.localhost:4943`;
        }
      } else {
        identityProvider = "https://identity.ic0.app";
      }

      await authClient.login({
        identityProvider,
        onSuccess: () => updateClient(authClient),
      });
    }
  };

  const logout = async () => {
    if (authClient) {
      await authClient.logout();
      await updateClient(authClient);
    }
  };

  return (
    <AuthContext.Provider
      value={{ isLogin, identity, login, logout, assetManager }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const authContextValue = useContext(AuthContext);

  if (!authContextValue) {
    throw Error("useAuthContext hook must be used inside AuthContext provider");
  }

  return authContextValue;
};
