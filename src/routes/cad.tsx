import { createFileRoute } from "@tanstack/react-router";
import MiniCadPage from "../components/cad/MiniCadPage";

export const Route = createFileRoute("/cad")({
  component: MiniCadPage,
});
