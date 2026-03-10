import { useEffect } from "react";
import { transliterateUzToRu } from "../utils/transliterate";

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT"]);

const shouldSkipNode = (node: Node) => {
  if (node.nodeType !== Node.ELEMENT_NODE) return false;
  const element = node as HTMLElement;
  if (SKIP_TAGS.has(element.tagName)) return true;
  if (element.isContentEditable) return true;
  if (element.closest('[data-no-transliterate="true"]')) return true;
  return false;
};

const shouldSkipTextNode = (textNode: Text) => {
  const parent = textNode.parentElement;
  if (!parent) return true;
  if (SKIP_TAGS.has(parent.tagName)) return true;
  if (parent.isContentEditable) return true;
  if (parent.closest('[data-no-transliterate="true"]')) return true;
  return false;
};

const processTextNode = (textNode: Text) => {
  if (shouldSkipTextNode(textNode)) return;
  const original = textNode.nodeValue ?? "";
  const converted = transliterateUzToRu(original);
  if (converted !== original) {
    textNode.nodeValue = converted;
  }
};

const walkAndProcess = (root: Node) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  let currentNode = walker.nextNode();
  while (currentNode) {
    processTextNode(currentNode as Text);
    currentNode = walker.nextNode();
  }
};

const TransliterateObserver = () => {
  useEffect(() => {
    if (!document.body) return;

    let isProcessing = false;

    const processMutationTarget = (target: Node) => {
      if (shouldSkipNode(target)) return;
      walkAndProcess(target);
    };

    const observer = new MutationObserver((mutations) => {
      if (isProcessing) return;
      isProcessing = true;

      for (const mutation of mutations) {
        if (mutation.type === "characterData" && mutation.target) {
          processMutationTarget(mutation.target);
        }

        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => processMutationTarget(node));
        }
      }

      isProcessing = false;
    });

    walkAndProcess(document.body);

    observer.observe(document.body, {
      childList: true,
      characterData: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
};

export default TransliterateObserver;
