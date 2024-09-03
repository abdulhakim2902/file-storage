import Head from "next/head";
import AdbIcon from "@mui/icons-material/Adb";
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';

import { AppBar, Box, Button, CircularProgress, CircularProgressProps, IconButton, Paper, styled, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Toolbar, Typography } from "@mui/material";
import React, { useEffect, useMemo, useState } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { HttpAgent } from "@dfinity/agent";
import { AssetManager } from "@dfinity/assets";
import { Principal } from "@dfinity/principal";

// TODO:
// 1. Limit only accept tar.gx
// 2. Limit size to 1GB

type Upload = {
  key: string;
  filename: string;
}

const isLocal = process.env.DFX_NETWORK !== "ic";
const canisterId = process.env.CANISTER_ID || '';

function CircularProgressWithLabel(
  props: CircularProgressProps & { value: number },
) {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress variant="determinate" {...props} />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography
          variant="caption"
          component="div"
          sx={{ color: 'whitesmoke' }}
        >{`${Math.round(props.value)}%`}</Typography>
      </Box>
    </Box>
  );
}

export default function Home() {
  const [isLogin, setIsLogin] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [authClient, setAuthClient] = useState<AuthClient>();
  const [principal, setPrincipal] = useState<Principal>();
  const [progress, setProgress] = useState<number>();
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [agent, setAgent] = useState<HttpAgent>()

  const assetManager = useMemo(() => {
    if (agent) {
      return new AssetManager({ canisterId, agent })
    }

    return null
  }, [agent])

  useEffect(() => {
    AuthClient.create().then(updateClient)
  }, []);

  useEffect(() => {
    if (!assetManager || !isLogin) return;

    assetManager.list()
      .then(assets => assets
        .filter(asset => asset.key.startsWith(`/uploads/${principal?.toString() || ''}`))
        .sort((a, b) => Number(b.encodings[0].modified - a.encodings[0].modified))
        .map(({ key }) => {
          const fileName = key.split('/').slice(-1)[0];

          return { key, filename: fileName };
        }))
      .then(setUploads);
}, [assetManager, isLogin, principal]);

  const updateClient = async (client: AuthClient) => {
    const isLogin = await client.isAuthenticated();
    const identity = client.getIdentity();
    const principal = identity.getPrincipal();

    const agent = await HttpAgent.create({ 
      host: isLocal ? `http://127.0.0.1:${window.location.port}` : 'https://ic0.app',
      identity: identity,
    });

    if (isLocal) {
      await agent.fetchRootKey()
    }

    console.log(principal.toString())

    setAuthClient(client);
    setPrincipal(principal);
    setIsLogin(isLogin);
    setAgent(agent);
  }

  const login = async () => {
    if (authClient) {
      let identityProvider;

      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      if (isLocal) {
        if (isSafari) {
          identityProvider = `http://localhost:4943/?canisterId=${process.env.CANISTER_ID_INTERNET_IDENTITY}`;
        } else {
          identityProvider = `http://${process.env.CANISTER_ID_INTERNET_IDENTITY}.localhost:4943`;
        }
      } else {
        identityProvider = 'https://identity.ic0.app';
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

    setProgress(undefined)
  }

  const upload = async () => {
    if (!isLogin || !assetManager) return;

    const input = document.createElement('input');
  
    input.type = 'file';
    input.multiple = false;
    input.click();
    input.onchange = async () => {
      if (!input.files) return;

      try {
        setProgress(0);
        setIsUploading(true);

        const batch = assetManager.batch();
        const items = await Promise.all(Array.from(input.files).map(async (file) => {
          const name = file.name.split('.');
          const ext = name.pop()
          const filename = name.join('_')
            .toLowerCase()
            .replace(/\W+/gi, ' ')
            .replace('_', ' ')
            .trim()
            .replace(/\s+/gi, '_');
            
          const fileName = [filename, ext].join('.')

          const key = await batch.store(file, { path: `/uploads/${principal?.toString()}`, fileName });

          return { key, filename: fileName };
        }));

        await batch.commit({ onProgress: ({current, total}) => setProgress(current / total) });

        setUploads(prevState => [...items, ...prevState])
      } catch (e: any) {
        if (e.message.includes('Caller is not authorized')) {
          alert("Caller is not authorized, follow Authorization instructions in README");
        } else {
          throw e;
        }
      } finally {
        setProgress(undefined);
        setIsUploading(false);
      }
    };
  }

  const download = async (key: string, filename: string) => {
    if (isLogin && assetManager) {
      const link = document.createElement("a");
      link.href = key;
      // Setting filename received in response
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  const remove = async (key: string) => {
    if (isLogin && assetManager) {
      await assetManager.delete(key);
      setUploads((prev) => prev.filter(e => e.key !== key))
    }
  }

  return (
    <React.Fragment>
      <Head>
        <title>File Storage</title>
      </Head>
      <Box sx={{ flexGrow: 1, height: '100vh' }}>
        <AppBar position="static">
          <Toolbar>
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 2 }}
            >
              <AdbIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              File Storage
            </Typography>
            <Button color="inherit" onClick={() => isLogin ? logout() : login()}>{isLogin ? "Logout" : "Login"}</Button>
          </Toolbar>
        </AppBar>
        {isLogin && (
          <React.Fragment>
            <Box marginY={2} paddingX={2} width="100%" display="flex" justifyContent="end">
              <Button onClick={upload} disabled={isUploading} variant="contained" sx={{ width: "100px", height: "35px" }}>
                {!isUploading ? "Upload" : <CircularProgressWithLabel size={20} value={progress || 0} />}
              </Button>
            </Box>
            <Box paddingX={2}>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell align="center">No.</TableCell>
                      <TableCell align="center">File Name</TableCell>
                      <TableCell align="center">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {uploads.map((data, index) => {
                      return (
                        <TableRow key={data.key}>
                          <TableCell align="center">{index + 1}</TableCell>
                          <TableCell align="center">{data.filename}</TableCell>
                          <TableCell align="center">
                            <IconButton onClick={() => download(data.key, data.filename)}><DownloadIcon /></IconButton>
                            <IconButton onClick={() => remove(data.key)}><DeleteIcon /></IconButton>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </React.Fragment>
        )}
      </Box>
    </React.Fragment>
  );
}
