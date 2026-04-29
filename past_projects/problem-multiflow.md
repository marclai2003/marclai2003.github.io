# Multicommodity flow in Trees

In the maximum multicommodity flow problem (or max multiflow problem), we are given a capacitated graph $G = (V,E)$ 
and a commodity graph $H =(V,F)$. Each commodity is represented as an edge in $H$ 
which assiciated two endpoints which we want to route flow between. 
The goal is to maximize the number of commodities routed. One popular regime is the unsplittable flow regime
where each commodity must be routed on the same path in $G$. I have not personally studied 
this regime since my focus has been algorithms in trees for which paths between any 
two nodes are unique. 

## Unit Capacities
[Primal-dual approximation algorithms for integral flow and multicut in trees - Garg et al.](https://link.springer.com/article/10.1007/BF02523685)

For the unit capacity case on a tree, the problem can be solved in polynomial time. The 
two important ideas are that 
1) For height-1 trees, the max multiflow problem is equivalent to solving 
a max cardinality matching. Edmond's blossom algorithm in a polynomial time solution to this problem. 
2) For any subtree of our graph, only one commodity can be routed out of this subtree. 
So the algorithm first solves a max matching, then looks for augmenting paths of the matching to find 
nodes that can be avoided in a max matching, then performs a contraction of height-1 trees into its root 
where the commodities on the nodes that can be avoided are perserved. 
 
## General Capacities
[Primal-dual approximation algorithms for integral flow and multicut in trees - Garg et al.](https://link.springer.com/article/10.1007/BF02523685)

By allowing capacities in $\{1,2\}$, the problem becomes APX-hard. This is shown by a reduction to 
3-Dimensional Matching. The transformation is shown to be an L-reduction. For general capacities, 
a 2-approximation exists. This is shown by formulating the problem as an IP and constructing the
dual object to multiflows: multicuts. A multicut is a subset of edges in $G$ that disconnects all 
commodity pairs. The capacity of any multicut is always an upper bound on any feasible multiflow. The 
proof demonstrates multicut that contains at most two edges on the commodities routed on a greedily 
constructed feasible flow. Thus
$$\text{C} \leq 2\text{F} \leq 2\text{OPT}_F.$$

## Profits
[Multicommodity Demand Flow in a Tree and Packing Integer Programs - Chekuri et al.](https://dl.acm.org/doi/10.1145/1273340.1273343)

Next, in multicommodity profit flows, we allow rational profits on the commodities. This problem is 
studied in the all-or-nothing profit regime where profits are only obtained by routing the entire 
commodity (all 1 unit of it, not fractionally). Thus, it is easy to represent this problem as an Integer 
Program, where 
1) The variables $x_f$ decide whether commodity $f$ is routed
2) The constraints enforce capacity constraints
3) The objective is $w^Tx$ where $w$ is the profit vector. 
It is shown that with general capacities, that a 4-approximation exists. 

## Demands
[Multicommodity Demand Flow in a Tree and Packing Integer Programs - Chekuri et al.](https://dl.acm.org/doi/10.1145/1273340.1273343)

