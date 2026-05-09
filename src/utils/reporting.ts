interface ScenarioReportingContext {
  attach: (...args: any[]) => void | Promise<void>;
  log: (text: string) => void | Promise<void>;
  link: (...url: string[]) => void | Promise<void>;
}

let currentScenarioReportingContext: ScenarioReportingContext | undefined;

const sanitizeFileName = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const getScenarioReportingContext = (): ScenarioReportingContext | undefined =>
  currentScenarioReportingContext;

export const setScenarioReportingContext = (
  context: ScenarioReportingContext | undefined
): void => {
  currentScenarioReportingContext = context;
};

export const reportStep = async <T>(name: string, action: () => Promise<T> | T): Promise<T> =>
  action();

export const attachText = async (name: string, content: string): Promise<void> => {
  const context = getScenarioReportingContext();

  if (!context) {
    return;
  }

  await context.attach(content, {
    mediaType: "text/plain",
    fileName: `${sanitizeFileName(name)}.txt`
  });
};

export const attachJson = async (name: string, content: unknown): Promise<void> => {
  const context = getScenarioReportingContext();

  if (!context) {
    return;
  }

  await context.attach(JSON.stringify(content, null, 2), {
    mediaType: "application/json",
    fileName: `${sanitizeFileName(name)}.json`
  });
};

export const attachImage = async (name: string, content: Buffer): Promise<void> => {
  const context = getScenarioReportingContext();

  if (!context) {
    return;
  }

  await context.attach(content, {
    mediaType: "image/png",
    fileName: `${sanitizeFileName(name)}.png`
  });
};
