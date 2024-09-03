import React from "react";
import Head from "next/head";

import { Box } from "@mui/material";
import { DownloadFile } from "@storage/src/components/DownloadFile";
import { Navigation } from "@storage/src/components/Navigation";

// TODO:
// 1. Limit only accept tar.gx
// 2. Auto delete file
// 3. Forbid logout when still loading

export default function Home() {
  return (
    <React.Fragment>
      <Head>
        <title>File Storage</title>
      </Head>
      <Box sx={{ flexGrow: 1, height: "100vh" }}>
        <Navigation />
        <DownloadFile />
      </Box>
    </React.Fragment>
  );
}
