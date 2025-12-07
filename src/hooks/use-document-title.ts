import { useEffect } from "react";

/**
 * A hook to update the document title when a component mounts
 *
 * @param title - The title to set for the document
 * @param options - Additional options
 * @param options.restoreOnUnmount - Whether to restore the previous title when the component unmounts
 */
export function useDocumentTitle(
  title: string,
  options: { restoreOnUnmount?: boolean } = {}
) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    return () => {
      // Restore the previous title if restoreOnUnmount is true
      if (options.restoreOnUnmount) {
        document.title = previousTitle;
      }
    };
  }, [title, options.restoreOnUnmount]);
}
