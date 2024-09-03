import { AppBar, Button, IconButton, Toolbar, Typography } from "@mui/material";
import { useAuth } from "../hooks/use-auth.hook";

import AdbIcon from "@mui/icons-material/Adb";

export const Navigation = () => {
  const { isLogin, login, logout } = useAuth();

  return (
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
        <Button color="inherit" onClick={() => (isLogin ? logout() : login())}>
          {isLogin ? "Logout" : "Login"}
        </Button>
      </Toolbar>
    </AppBar>
  );
};
