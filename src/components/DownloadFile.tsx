import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useAuth } from "../hooks/use-auth.hook";

import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ClearIcon from "@mui/icons-material/Clear";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import { useSnackbar } from "notistack";

type UploadData = {
  key: string;
  filename: string;
  timestamp: number;
};

export const DownloadFile = () => {
  const { isLogin, identity, assetManager } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [file, setFile] = useState<File>();
  const [progress, setProgress] = useState(0);
  const [uploads, setUploads] = useState<UploadData[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isLogin) {
      if (assetManager) {
        assetManager
          .list()
          .then((assets) =>
            assets
              .filter((asset) =>
                asset.key.startsWith(
                  `/uploads/${identity?.getPrincipal().toString() || ""}`,
                ),
              )
              .sort((a, b) =>
                Number(b.encodings[0].modified - a.encodings[0].modified),
              )
              .map(({ key }) => {
                const fileName = key.split("/").slice(-1)[0];
                const [timestamp, ...filename] = fileName.split("-");

                return {
                  key,
                  filename: filename.join(""),
                  timestamp: +timestamp,
                };
              }),
          )
          .then(setUploads)
          .catch(err => {
            enqueueSnackbar(err.message, {
              variant: "error",            
            });
          });
      }
    } else {
      setUploads([]);
    }
    /* eslint-disable react-hooks/exhaustive-deps*/
  }, [assetManager, isLogin, identity]);

  const addFile = () => {
    const input = document.createElement("input");

    input.type = "file";
    input.multiple = false;
    input.click();
    input.onchange = () => {
      if (input.files && input.files.length > 0) {
        const file = input.files[0];
        if (file.size > Math.pow(10, 9)) {
          return enqueueSnackbar("Max size of 1 GB", {
            variant: "error",            
          });
        }

        // if (file.type) {
        //   // throw err
        // }

        setFile(input.files[0]);
      }
    };
  };

  const uploadFile = async () => {
    if (!assetManager || !isLogin) return;
    if (file) {
      try {
        setProgress(0);
        setIsUploading(true);

        const batch = assetManager.batch();
        const timestamp = new Date().getTime();
        const filename = [timestamp, file.name].join("-");

        const key = await batch.store(file, {
          path: `/uploads/${identity?.getPrincipal().toString()}`,
          fileName: filename,
        });

        await batch.commit({
          onProgress: ({ current, total }) => setProgress(current / total),
        });

        setUploads((prev) => [
          { key, filename: file.name, timestamp },
          ...prev,
        ]);
      } catch (err: any) {
        enqueueSnackbar(err.message, {
          variant: "error",            
        });
      } finally {
        setIsUploading(false);
        setFile(undefined);
      }
    }
  };

  const downloadFile = async (data: UploadData) => {
    if (isLogin && assetManager) {
      const link = document.createElement("a");
      link.href = data.key;
      link.setAttribute("download", data.filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const removeFile = async (key: string) => {
    if (isLogin && assetManager) {
      await assetManager.delete(key);
      setUploads((prev) => prev.filter((e) => e.key !== key));
    }
  };

  return (
    <Box marginX={2} marginTop={2}>
      <TextField
        fullWidth
        placeholder="Choose a file"
        disabled
        value={file?.name || ""}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                {file && (
                  <IconButton
                    size="small"
                    sx={{ marginRight: 1 }}
                    onClick={() => setFile(undefined)}
                  >
                    <ClearIcon />
                  </IconButton>
                )}
                <Button
                  variant={file ? "contained" : "outlined"}
                  onClick={file ? uploadFile : addFile}
                  disabled={isUploading || !isLogin}
                >
                  <CloudUploadIcon fontSize="small" />
                  <Typography component="p" marginLeft={1}>
                    {file ? "Upload" : "Choose a file..."}
                  </Typography>
                </Button>
              </InputAdornment>
            ),
          },
        }}
      />
      {isUploading && <LinearProgress variant="determinate" value={progress} />}
      {isLogin && uploads.length > 0 && (
        <Box marginTop={2}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell align="center">No.</TableCell>
                  <TableCell align="center">File Name</TableCell>
                  <TableCell align="center">Date</TableCell>
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
                        {new Date(data.timestamp).toString()}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton onClick={() => downloadFile(data)}>
                          <DownloadIcon />
                        </IconButton>
                        <IconButton onClick={() => removeFile(data.key)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
};
