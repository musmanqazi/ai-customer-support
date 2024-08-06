import { Box, Typography } from "@mui/material";
import Image from "next/image";

export default function Home() {
  return (
    <Box width="100vw" height="100vh" display="flex" flexDirection="column" alignItems="center" justifyContent="center">
      <Typography variant="h3">
        Hello World
      </Typography>
    </Box>
  );
}
