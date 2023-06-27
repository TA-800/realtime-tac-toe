import { useRouteError, isRouteErrorResponse } from "react-router-dom";

// Reference: https://stackoverflow.com/questions/75944820/whats-the-correct-type-for-error-in-userouteerror-from-react-router-dom
export default function ErrorPage() {
    const error = useRouteError();
    let errorMessage: string;

    if (isRouteErrorResponse(error)) {
        // error is type `ErrorResponse`
        errorMessage = error.error?.message || error.statusText;
    } else if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === "string") {
        errorMessage = error;
    } else {
        console.error(error);
        errorMessage = "Unknown error";
    }

    return (
        <div id="error-page" className="flex flex-col gap-8 justify-center items-center h-screen">
            <h1 className="text-4xl font-bold">Oops!</h1>
            <p className="text-center">Sorry, something unexpected occured. Try refreshing the page or try again later.</p>
            <p className="text-slate-400">
                <i>{errorMessage}</i>
            </p>
        </div>
    );
}
