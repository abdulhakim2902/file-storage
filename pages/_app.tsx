import { AuthProvider } from "@storage/src/hooks/use-auth.hook";
import "@storage/styles/globals.css";
import type { AppProps } from "next/app";
import { SnackbarProvider } from "notistack";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SnackbarProvider
      autoHideDuration={3000}
      preventDuplicate
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "left",
      }}
    >
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </SnackbarProvider>
  );
}
