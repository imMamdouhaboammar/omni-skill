# Purpose Before Means

Always state the intended outcome before describing the mechanism or procedure.

## The Invariant

Readers process instructions sequentially. When presented with a procedure without a goal, they hold execution steps in working memory while wondering "why am I doing this?". 

### Weak (Means Before Purpose)
> Run `bun test --filter router` and check whether `RouteResult` includes `confidence`. This will verify that the dynamic router assigns probabilities.

### Strong (Purpose Before Means)
> Verify dynamic router probability assignments by running `bun test --filter router` and checking `RouteResult.confidence`.

State the destination first. The reader can then evaluate whether the mechanical steps actually reach it.
