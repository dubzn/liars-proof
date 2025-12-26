import { useEffect, useState } from "react";
import type { Condition } from "@/bindings/typescript/models.gen";

const TORII_URL = import.meta.env.VITE_ZN_SEPOLIA_TORII_URL;
const GRAPHQL_URL = `${TORII_URL}/graphql`;

/**
 * Hook that fetches and watches a condition using GraphQL directly
 * Polls every 2 seconds to detect changes
 */
export const useConditionGraphQL = (conditionId: number) => {
  const [condition, setCondition] = useState<Condition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (conditionId === 0) {
      setIsLoading(false);
      return;
    }

    const fetchCondition = async () => {
      try {
        const query = `
          query {
            liarsProof3ConditionModels(where: { id: ${conditionId} }) {
              edges {
                node {
                  id
                  condition
                  quantity
                  comparator
                  value
                  suit
                }
              }
            }
          }
        `;

        const response = await fetch(GRAPHQL_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.errors) {
          throw new Error(result.errors[0].message);
        }

        const edges = result.data?.liarsProof3ConditionModels?.edges;
        if (edges && edges.length > 0) {
          const conditionData = edges[0].node;
          setCondition(conditionData as Condition);
        } else {
          console.log(
            `[useConditionGraphQL] ⚠️ No condition found with ID ${conditionId}`,
          );
          setCondition(null);
        }

        setIsLoading(false);
      } catch (err) {
        console.error(
          `[useConditionGraphQL] ❌ Error fetching condition ${conditionId}:`,
          err,
        );
        setError(err as Error);
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchCondition();

    // Poll for updates every 2 seconds
    const interval = setInterval(fetchCondition, 2000);

    return () => clearInterval(interval);
  }, [conditionId]);

  return { condition, isLoading, error };
};
