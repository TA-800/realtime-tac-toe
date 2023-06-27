import { useButton, AriaButtonProps } from "@react-aria/button";
import { FocusRing } from "@react-aria/focus";
import { useRef } from "react";

export default function Button(props: AriaButtonProps & { className?: string }) {
    let ref = useRef(null);
    let { buttonProps, isPressed } = useButton(props, ref);
    let { children, className } = props;

    return (
        <FocusRing focusRingClass="ring-1 ring-blue-400 ring-offset-2 ring-offset-black">
            <button
                {...buttonProps}
                className={` ${isPressed ? "-translate-x-px translate-y-px bg-blue-800" : ""}
                flex flex-row gap-1 justify-center items-center bg-blue-600 text-white font-semibold px-3 py-2 rounded w-fit h-11 disabled:bg-gray-700 focus:outline-none
                ${className ?? ""}`}
                ref={ref}>
                {children}
            </button>
        </FocusRing>
    );
}
