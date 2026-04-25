# Load Balancing in the Streaming Model

[Streaming and Communication Complexity of Load-Balancing via Matching Contractors - Assadi et al.](https://arxiv.org/abs/2410.16094)

In the Load Balancing problem, we are given a bipartite graph G = (L,R,E). 
The goal is to find an "assignment" of L to R (through E) that minimizes the 
maximum number of nodes assigned to each $r \in R$. In the streaming model, we are
given $\tilde{O}(n)$ space and allowed one pass of the stream, where edges arrive 
one by one. The space complexity is justified since the simplest properties, such 
as connectivity, already requires n space to determine. The streaming model is 
intimately related to one-way communication complexity since any streaming algorithm
can be turned into a one-way commuinication protocol with cost at most $\tilde{O}(n)$ 
-- Alice runs the algorithm on her input and sends the memory contents to Bob to 
complete the algorithm. Thus, the one-way communication complexity of the Load Balancing 
problem is studied. 