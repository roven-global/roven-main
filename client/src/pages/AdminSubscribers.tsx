import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import Axios from "@/utils/Axios";
import { format } from "date-fns";

// Type definitions
interface Subscriber {
  _id: string;
  email: string;
  createdAt: string;
}

interface PaginationInfo {
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

const AdminSubscribers = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const page = useMemo(
    () => parseInt(searchParams.get("page") || "1", 10),
    [searchParams]
  );
  const limit = 15; // As defined in the backend

  useEffect(() => {
    const fetchSubscribers = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        const res = await Axios.get(`/api/newsletter?${params.toString()}`);
        setSubscribers(res.data.data.subscribers);
        setPagination(res.data.data.pagination);
      } catch (err) {
        setError("Failed to fetch subscribers.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscribers();
  }, [page]);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= (pagination?.totalPages || 1)) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("page", String(newPage));
      setSearchParams(newParams);
    }
  };

  const handleExport = () => {
    // This will trigger the download in the browser
    window.open(`${Axios.defaults.baseURL}/api/newsletter/export`);
  };

  return (
    <div className="p-4 bg-admin-bg min-h-screen admin-panel-container">
      {/* Admin Panel Header */}
      <div className="flex items-center justify-between mb-4 bg-white border-b border-gray-200 px-6 py-3 -mx-6 admin-panel-header">
        <div>
          <h1 className="font-sans text-2xl font-bold text-gray-900">
            Newsletter Subscribers
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={handleExport}
            className="bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Download className="mr-2 h-4 w-4" />
            Export as CSV
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
          {error}
        </p>
      )}

      <div className="rounded-xl border border-admin-border bg-admin-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-admin-border bg-admin-accent/50">
              <TableHead className="text-admin-text font-semibold">
                Email Address
              </TableHead>
              <TableHead className="w-[250px] text-admin-text font-semibold">
                Subscription Date
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: limit }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={2}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : subscribers.length > 0 ? (
              subscribers.map((subscriber) => (
                <TableRow key={subscriber._id}>
                  <TableCell className="font-medium text-foreground">
                    {subscriber.email}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {format(new Date(subscriber.createdAt), "PPpp")}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="text-center h-24 text-muted-foreground"
                >
                  No subscribers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(page - 1);
                  }}
                  className={`cursor-pointer ${
                    page <= 1 ? "pointer-events-none opacity-50" : ""
                  }`}
                />
              </PaginationItem>
              {[...Array(pagination.totalPages)].map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(i + 1);
                    }}
                    isActive={page === i + 1}
                    className="cursor-pointer"
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(page + 1);
                  }}
                  className={`cursor-pointer ${
                    page >= pagination.totalPages
                      ? "pointer-events-none opacity-50"
                      : ""
                  }`}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default AdminSubscribers;
