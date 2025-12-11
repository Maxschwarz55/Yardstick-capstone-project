// src/Diagnostics.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Heading, Button, Table, VStack } from "@chakra-ui/react";
import "./Diagnostics.css";

const API = process.env.REACT_APP_API_URL
  ? `http://${process.env.REACT_APP_API_URL}`
  : "http://localhost:4000";

export default function Diagnostics() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [diag, setDiag] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${API}/diagnostics`);
        const ct = res.headers.get("content-type") || "";
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status}: ${text.slice(0, 120)}`);
        }
        if (!ct.includes("application/json")) {
          const text = await res.text().catch(() => "");
          throw new Error(`Expected JSON, got: ${text.slice(0, 120)}…`);
        }
        const json = await res.json();
        if (!cancelled) setDiag(json);
      } catch (e) {
        if (!cancelled) setError(e.message ?? "Failed to fetch diagnostics");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const returnClick = () => navigate("/");

  if (loading)
    return (
      <div className="diag-page">
        <h1>Diagnostics</h1>
        <p>Loading…</p>
      </div>
    );
  if (error)
    return (
      <div className="diag-page">
        <h1>Diagnostics</h1>
        <p style={{ color: "crimson" }}>{error}</p>
        <button className="btn" onClick={returnClick}>
          Return
        </button>
      </div>
    );
  if (!diag)
    return (
      <div className="diag-page">
        <h1>Diagnostics</h1>
        <p>No data</p>
        <button className="btn" onClick={returnClick}>
          Return
        </button>
      </div>
    );

  const totalPersons = diag?.totals?.person ?? 0;
  const lastCrawled = fmt(diag?.lastCrawled);
  const nextScheduled = fmt(diag?.nextSched);
  const zips = diag?.zips ?? [];

  return (
    <Box className="diag-page" p={6}>
      <Heading mb={6}>Diagnostics</Heading>
      <Box className="diag-grid">
        <Box
          borderWidth="1px"
          borderRadius="lg"
          overflow="hidden"
          bg="bg.panel"
        >
          <Box px={6} py={4} borderBottomWidth="1px" bg="bg.muted">
            <Heading size="lg">Database & Crawl Status</Heading>
          </Box>
          <Box p={6}>
            <VStack align="stretch" gap={6}>
              <Box>
                <Heading size="md" mb={3}>
                  NY Sex Offender Registry
                </Heading>
                <Table.Root variant="outline" size="sm">
                  <Table.Body>
                    <Table.Row>
                      <Table.Cell fontWeight="medium">
                        Total records in database
                      </Table.Cell>
                      <Table.Cell>{num(totalPersons)}</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell fontWeight="medium">Last crawled</Table.Cell>
                      <Table.Cell>{lastCrawled}</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell fontWeight="medium">
                        Next scheduled crawl
                      </Table.Cell>
                      <Table.Cell>{nextScheduled}</Table.Cell>
                    </Table.Row>
                  </Table.Body>
                </Table.Root>
              </Box>

              {zips.length > 0 && (
                <Box>
                  <Heading size="md" mb={3}>
                    Recent ZIP Code Crawl Activity
                  </Heading>
                  <Table.Root variant="outline" size="sm">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeader>ZIP Code</Table.ColumnHeader>
                        <Table.ColumnHeader>Last Crawled</Table.ColumnHeader>
                        <Table.ColumnHeader>Next Scheduled</Table.ColumnHeader>
                        <Table.ColumnHeader>Total Records</Table.ColumnHeader>
                        <Table.ColumnHeader>
                          Added (Last Crawl)
                        </Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {zips.map((z, i) => (
                        <Table.Row key={i}>
                          <Table.Cell>{z.zip}</Table.Cell>
                          <Table.Cell>{fmt(z.lastCrawled)}</Table.Cell>
                          <Table.Cell>{fmt(z.nextScheduled)}</Table.Cell>
                          <Table.Cell>{num(z.totalRecords)}</Table.Cell>
                          <Table.Cell>{num(z.recordsAdded)}</Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                </Box>
              )}
            </VStack>
          </Box>
        </Box>
      </Box>
      <Button mt={6} onClick={returnClick}>
        Return
      </Button>
    </Box>
  );
}

function fmt(d) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return String(d);
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function num(n) {
  if (n === null || n === undefined) return "—";
  return Number(n).toLocaleString();
}