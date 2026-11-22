import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { createFeedClient } from "./feed-client.ts";
import { feedUrl } from "./feed-url.ts";
import "./index.css";

// One feed connection for the page's lifetime, outside React, so re-renders and
// StrictMode's double mounting never open a second one.
const client = createFeedClient({ url: feedUrl(window.location) });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App client={client} />
  </StrictMode>,
);
