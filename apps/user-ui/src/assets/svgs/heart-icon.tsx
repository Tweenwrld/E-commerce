import * as React from "react";

const HeartIcon = (props: any) => (
    <svg
        width={20}
        height={23}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        <path
            d="M7.5 3.75C5.1 3.75 3 5.765 3 8.25c0 1.654.672 3.151 1.757 4.237L12 20.25l7.243-7.763C20.328 11.401 21 9.904 21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733z"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 20.25l-7.243-7.763c-.544-.583-.98-1.246-1.297-1.959-.635-1.427-.635-3.071 0-4.498C4.425 4.978 5.874 3.75 7.5 3.75c1.24 0 2.365.503 3.18 1.318.408.408.738.892.976 1.415.238-.523.568-1.007.976-1.415C13.447 4.253 14.572 3.75 15.812 3.75c1.626 0 3.075 1.228 4.04 2.28.635 1.427.635 3.071 0 4.498-.317.713-.753 1.376-1.297 1.959L12 20.25z"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export default HeartIcon;