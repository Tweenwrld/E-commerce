import * as React from "react";

const CartIcon = (props: any) => (
    <svg
        width={20}
        height={23}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        <path
            d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5M5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M4.25 21.75a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h.537v3c0 .207.168.375.375.375s.375-.168.375-.375v-3h10.4v3c0 .207.168.375.375.375s.375-.168.375-.375v-3h.537l1.119 1.007-1.263 12c-.07.665-.45 1.243-1.119 1.243H4.25zm4.375-11.25a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0z"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export default CartIcon;