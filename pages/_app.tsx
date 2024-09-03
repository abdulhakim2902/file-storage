import { AuthProvider } from "@storage/src/hooks/use-auth.hook";
import "@storage/styles/globals.css";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return <AuthProvider><Component {...pageProps} /></AuthProvider>;
}
