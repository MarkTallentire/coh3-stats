import { IconButton } from "../icon-button/icon-button";

export interface SteamProps {
  label: React.ReactNode;
}

export const PSNIcon: React.FC<SteamProps> = ({ label }) => {
  return (
    <IconButton label={label}>
      <svg
        width="22px"
        height="22px"
        viewBox="0 0 1024 1024"
        xmlns="http://www.w3.org/2000/svg"
        fill="#000000"
      >
        <g id="SVGRepo_bgCarrier" strokeWidth="0" />
        <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" />
        <g id="SVGRepo_iconCarrier">
          <circle cx="512" cy="512" r="512" style={{ fill: "#0070d1" }} />
          <path
            d="M242.37 595.7c-21.06 14-14 40.72 30.89 53.36a302.24 302.24 0 0 0 146 11.23c2.81 0 5.62-1.4 7-1.4v-47.75l-47.74 15.45c-18.25 5.62-36.51 7-54.76 2.81-14-4.21-11.23-12.64 5.62-19.66L426.32 576v-52l-134.8 46.34a181.6 181.6 0 0 0-49.15 25.36zm325.77-210.63v136.21c57.57 28.08 102.51 0 102.51-73 0-74.42-26.68-108.12-103.91-134.8-40.72-14-82.85-26.68-125-35.1v405.78l98.29 29.49V372.43c0-15.45 0-26.68 11.23-22.47 15.48 4.22 16.88 19.66 16.88 35.11zM750.69 563.4c-40.72-14-84.25-19.66-126.38-15.45-22.47 1.4-43.53 7-63.19 14l-4.21 1.4v54.76l91.27-33.7c18.25-5.62 36.51-7 54.76-2.81 14 4.21 11.23 12.64-5.62 19.66l-140.42 52v53.36L750.69 635c14-5.62 26.68-12.64 37.91-23.87 9.83-14.03 5.62-33.69-37.91-47.73z"
            style={{ fill: "#fff" }}
          />
        </g>
      </svg>
    </IconButton>
  );
};
