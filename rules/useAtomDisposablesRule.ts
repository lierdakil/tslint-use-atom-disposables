import {
  isCallExpression,
  isExpressionStatement
} from "tsutils";
import * as ts from "typescript";
import * as Lint from "tslint";

export class Rule extends Lint.Rules.TypedRule {
  public static metadata: Lint.IRuleMetadata = {
    ruleName: "use-atom-disposables",
    description: "The result of functions returning Disposable must be used.",
    optionsDescription: "This rule accepts no options",
    options: {},
    type: "functionality",
    typescriptOnly: true,
    requiresTypeInfo: true
  };

  public applyWithProgram(
    sourceFile: ts.SourceFile,
    program: ts.Program
  ): Lint.RuleFailure[] {
    return this.applyWithFunction(
      sourceFile,
      walk,
      [],
      program.getTypeChecker()
    );
  }
}

function walk(ctx: Lint.WalkContext<string[]>, tc: ts.TypeChecker) {
  return ts.forEachChild(ctx.sourceFile, function cb(node): void {
    if (isExpressionStatement(node)) {
      const { expression } = node;
      if (isCallExpression(expression)) {
        const type = tc.getTypeAtLocation(expression);
        const prop = type.getProperty('dispose')
        if (prop) {
          const propt = tc.getTypeOfSymbolAtLocation(prop, expression)
          const callSigs = propt.getCallSignatures()
          const hasSig = callSigs.some((sig) => {
            const rett = sig.getReturnType()
            const numArgs = sig.getParameters().length
            if (numArgs === 0) return true
            const retVoid = tc.getApparentType(rett).flags === ts.TypeFlags.Void
            if (retVoid) return true
            return false
          })
          if (hasSig) {
            ctx.addFailureAtNode(expression, "Disposables must not be ignored");
          }
        }
      }
    }
    return ts.forEachChild(node, cb);
  });
}
