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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import Axios from "@/utils/Axios";
import { useDebounce } from "@/hooks/use-debounce";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Type definitions
interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  volume: string;
}
interface Order {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  total: number;
  orderStatus: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  createdAt: string;
}
interface Customer {
  _id: string;
  name: string;
  email?: string;
  mobile?: string;
  totalOrders: number;
  lastOrderDate?: string;
  lastOrderStatus?:
    | "pending"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";
  orders: Order[];
}
interface PaginationInfo {
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

const getStatusColor = (status: Order["orderStatus"] | undefined) => {
  switch (status) {
    case "pending":
      return "bg-accent/50 text-accent-foreground";
    case "processing":
      return "bg-primary/50 text-primary-foreground";
    case "shipped":
      return "bg-primary/60 text-primary-foreground";
    case "delivered":
      return "bg-accent";
    case "cancelled":
      return "bg-destructive";
    default:
      return "bg-muted";
  }
};

const CustomerRow = ({ customer }: { customer: Customer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible
      asChild
      key={customer._id}
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <>
        <TableRow className="cursor-pointer">
          <TableCell>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-accent hover:text-accent-foreground"
              >
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                <span className="sr-only">Toggle details</span>
              </Button>
            </CollapsibleTrigger>
          </TableCell>
          <TableCell className="font-medium text-foreground">
            {customer.name}
          </TableCell>
          <TableCell className="text-foreground">
            {customer.email || customer.mobile}
          </TableCell>
          <TableCell className="text-center text-foreground">
            {customer.totalOrders}
          </TableCell>
          <TableCell className="text-foreground">
            {customer.lastOrderDate
              ? format(new Date(customer.lastOrderDate), "PP")
              : "N/A"}
          </TableCell>
          <TableCell>
            <Badge className={cn(getStatusColor(customer.lastOrderStatus))}>
              {customer.lastOrderStatus || "N/A"}
            </Badge>
          </TableCell>
        </TableRow>
        <CollapsibleContent asChild>
          <TableRow>
            <TableCell colSpan={6} className="p-0">
              <div className="p-4 bg-muted/20">
                <h4 className="font-bold mb-2 text-foreground">
                  Order History
                </h4>
                {customer.orders.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-foreground">
                          Order ID
                        </TableHead>
                        <TableHead className="text-foreground">Date</TableHead>
                        <TableHead className="text-foreground">Items</TableHead>
                        <TableHead className="text-foreground">
                          Amount
                        </TableHead>
                        <TableHead className="text-foreground">
                          Status
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customer.orders
                        .slice(0)
                        .reverse()
                        .map((order) => (
                          <TableRow key={order._id}>
                            <TableCell className="text-foreground">
                              {order.orderNumber}
                            </TableCell>
                            <TableCell className="text-foreground">
                              {format(new Date(order.createdAt), "PP")}
                            </TableCell>
                            <TableCell className="text-foreground">
                              {order.items
                                .map(
                                  (item) => `${item.name} (x${item.quantity})`
                                )
                                .join(", ")}
                            </TableCell>
                            <TableCell className="text-foreground">
                              ₹{order.total.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={cn(
                                  getStatusColor(order.orderStatus)
                                )}
                              >
                                {order.orderStatus}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground">
                    No orders found for this customer.
                  </p>
                )}
              </div>
            </TableCell>
          </TableRow>
        </CollapsibleContent>
      </>
    </Collapsible>
  );
};

const AdminCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const page = useMemo(
    () => parseInt(searchParams.get("page") || "1", 10),
    [searchParams]
  );
  const limit = useMemo(
    () => parseInt(searchParams.get("limit") || "10", 10),
    [searchParams]
  );
  const sortBy = useMemo(
    () => searchParams.get("sortBy") || "lastOrderDate",
    [searchParams]
  );
  const sortOrder = useMemo(
    () => searchParams.get("sortOrder") || "desc",
    [searchParams]
  );
  const status = useMemo(
    () => searchParams.get("status") || "",
    [searchParams]
  );

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
          sortBy,
          sortOrder,
        });
        if (debouncedSearchTerm) params.set("search", debouncedSearchTerm);
        if (status) params.set("status", status);

        const res = await Axios.get(
          `/api/admin/customers?${params.toString()}`
        );
        setCustomers(res.data.data.customers);
        setPagination(res.data.data.pagination);
      } catch (err) {
        setError("Failed to fetch customers.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [page, limit, sortBy, sortOrder, status, debouncedSearchTerm]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set("search", value);
    } else {
      newParams.delete("search");
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split(":");
    const newParams = new URLSearchParams(searchParams);
    newParams.set("sortBy", newSortBy);
    newParams.set("sortOrder", newSortOrder);
    setSearchParams(newParams);
  };

  const handleStatusChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === "all") {
      newParams.delete("status");
    } else {
      newParams.set("status", value);
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= (pagination?.totalPages || 1)) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("page", String(newPage));
      setSearchParams(newParams);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-sans font-bold text-foreground mb-6">
        Customers
      </h1>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Input
          placeholder="Search by name, email, order ID..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="max-w-sm bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-ring"
        />
        <div className="flex gap-4">
          <Select
            onValueChange={handleStatusChange}
            defaultValue={status || "all"}
          >
            <SelectTrigger className="w-[180px] bg-input border-border text-foreground focus:ring-ring">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem
                value="all"
                className="text-foreground focus:bg-accent focus:text-accent-foreground"
              >
                All Statuses
              </SelectItem>
              <SelectItem
                value="pending"
                className="text-foreground focus:bg-accent focus:text-accent-foreground"
              >
                Pending
              </SelectItem>
              <SelectItem
                value="processing"
                className="text-foreground focus:bg-accent focus:text-accent-foreground"
              >
                Processing
              </SelectItem>
              <SelectItem
                value="shipped"
                className="text-foreground focus:bg-accent focus:text-accent-foreground"
              >
                Shipped
              </SelectItem>
              <SelectItem
                value="delivered"
                className="text-foreground focus:bg-accent focus:text-accent-foreground"
              >
                Delivered
              </SelectItem>
              <SelectItem
                value="cancelled"
                className="text-foreground focus:bg-accent focus:text-accent-foreground"
              >
                Cancelled
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
            onValueChange={handleSortChange}
            defaultValue={`${sortBy}:${sortOrder}`}
          >
            <SelectTrigger className="w-[220px] bg-input border-border text-foreground focus:ring-ring">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem
                value="lastOrderDate:desc"
                className="text-foreground focus:bg-accent focus:text-accent-foreground"
              >
                Last Order: Newest
              </SelectItem>
              <SelectItem
                value="lastOrderDate:asc"
                className="text-foreground focus:bg-accent focus:text-accent-foreground"
              >
                Last Order: Oldest
              </SelectItem>
              <SelectItem
                value="totalOrders:desc"
                className="text-foreground focus:bg-accent focus:text-accent-foreground"
              >
                Total Orders: High to Low
              </SelectItem>
              <SelectItem
                value="totalOrders:asc"
                className="text-foreground focus:bg-accent focus:text-accent-foreground"
              >
                Total Orders: Low to High
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && <p className="text-destructive">{error}</p>}

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]"></TableHead>
              <TableHead className="text-foreground">Customer</TableHead>
              <TableHead className="text-foreground">Contact</TableHead>
              <TableHead className="text-center text-foreground">
                Total Orders
              </TableHead>
              <TableHead className="text-foreground">Last Order Date</TableHead>
              <TableHead className="text-foreground">
                Last Order Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: limit }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-12 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : customers.length > 0 ? (
              customers.map((customer) => (
                <CustomerRow key={customer._id} customer={customer} />
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center h-24 text-muted-foreground"
                >
                  No customers found.
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

export default AdminCustomers;
