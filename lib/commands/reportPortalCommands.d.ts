export {};

declare global {
  type RP_ATTRIBUTES = { key?: string; value: string };

  type RP_STATUS =
    | 'passed'
    | 'failed'
    | 'skipped'
    | 'stopped'
    | 'interrupted'
    | 'cancelled'
    | 'info'
    | 'warn';

  type RP_FILE = {
    // file name
    name: string;
    // media type, such as image/png
    type: string;
    // base64 string
    content: string;
  };

  namespace Cypress {
    interface Chainable {
      addTestAttributes(attributes: RP_ATTRIBUTES[]): Chainable<void>;

      setTestDescription(description: string): Chainable<void>;

      setTestCaseId(testCaseId: string, suiteTitle?: string): Chainable<void>;

      trace(message: string, file?: RP_FILE): Chainable<any>;

      logDebug(message: string, file?: RP_FILE): Chainable<any>;

      info(message: string, file?: RP_FILE): Chainable<any>;

      warn(message: string, file?: RP_FILE): Chainable<any>;

      error(message: string, file?: RP_FILE): Chainable<any>;

      fatal(message: string, file?: RP_FILE): Chainable<any>;

      launchTrace(message: string, file?: RP_FILE): Chainable<any>;

      launchDebug(message: string, file?: RP_FILE): Chainable<any>;

      launchInfo(message: string, file?: RP_FILE): Chainable<any>;

      launchWarn(message: string, file?: RP_FILE): Chainable<any>;

      launchError(message: string, file?: RP_FILE): Chainable<any>;

      launchFatal(message: string, file?: RP_FILE): Chainable<any>;
      // Waiting for migrate to TypeScript
      // Expected step: IStepHookParameter (https://github.com/badeball/cypress-cucumber-preprocessor/blob/055d8df6a62009c94057b0d894a30e142cb87b94/lib/public-member-types.ts#L39)
      cucumberStepStart(step: any): Chainable<any>;

      cucumberStepEnd(step: any): Chainable<any>;

      setStatus(status: RP_STATUS, suiteTitle?: string): Chainable<void>;

      setStatusPassed(suiteTitle?: string): Chainable<void>;

      setStatusFailed(suiteTitle?: string): Chainable<void>;

      setStatusSkipped(suiteTitle?: string): Chainable<void>;

      setStatusStopped(suiteTitle?: string): Chainable<void>;

      setStatusInterrupted(suiteTitle?: string): Chainable<void>;

      setStatusCancelled(suiteTitle?: string): Chainable<void>;

      setStatusInfo(suiteTitle?: string): Chainable<void>;

      setStatusWarn(suiteTitle?: string): Chainable<void>;

      setLaunchStatus(status: RP_STATUS): Chainable<void>;

      setLaunchStatusPassed(): Chainable<void>;

      setLaunchStatusFailed(): Chainable<void>;

      setLaunchStatusSkipped(): Chainable<void>;

      setLaunchStatusStopped(): Chainable<void>;

      setLaunchStatusInterrupted(): Chainable<void>;

      setLaunchStatusCancelled(): Chainable<void>;

      setLaunchStatusInfo(): Chainable<void>;

      setLaunchStatusWarn(): Chainable<void>;
    }
  }
}
