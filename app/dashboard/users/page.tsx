"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  X,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  branchId: string;
  status: string;
  createdAt: string;
  branch: {
    branchName: string;
    branchCode: string;
  };
}

interface Branch {
  branchId: string;
  branchName: string;
  branchCode: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "STAFF",
    branchId: "",
  });

  useEffect(() => {
    fetchUsers();
    fetchBranches();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/branches", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBranches(data);
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.branchId) {
      alert("Please fill in all required fields");
      return;
    }

    if (!editingUser && !formData.password) {
      alert("Password is required for new users");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
      const method = editingUser ? "PUT" : "POST";

      const body: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        branchId: formData.branchId,
      };

      if (formData.password) {
        body.password = formData.password;
      }

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        alert(
          editingUser
            ? "User updated successfully"
            : "User created successfully"
        );
        setShowModal(false);
        resetForm();
        fetchUsers();
      } else {
        alert(data.error || "Failed to save user");
      }
    } catch (error) {
      console.error("Error saving user:", error);
      alert("Failed to save user");
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      branchId: user.branchId,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        alert("User deleted successfully");
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "STAFF",
      branchId: "",
    });
    setEditingUser(null);
    setShowPassword(false);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "MANAGER":
        return "bg-[color:var(--warning)/.1] text-[color:var(--warning)]";
      case "BRANCH_ADMIN":
        return "bg-[color:var(--primary)/.1] text-[color:var(--primary)]";
      case "STAFF":
        return "bg-[color:var(--muted)/.1] text-[color:var(--muted-foreground)]";
      default:
        return "bg-[color:var(--muted)/.1] text-[color:var(--muted-foreground)]";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[color:var(--accent)]"></div>
      </div>
    );
  }

  return (
    <div className="text-[color:var(--card-foreground)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--card-foreground)] flex items-center">
            <Users className="w-8 h-8 mr-3 text-[color:var(--accent)]" />
            User Management
          </h1>
          <p className="text-[color:var(--muted-foreground)] text-sm mt-1">
            Manage system users and their branch access
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center px-6 py-3 bg-[color:var(--accent)] text-[color:var(--accent-foreground)] rounded-lg font-semibold shadow-lg hover:bg-[color:var(--accent)/.9] transition-all transform hover:scale-105"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add User
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-[color:var(--card)] rounded-xl shadow-sm border border-[color:var(--border)] overflow-hidden">
        {users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-[color:var(--muted-foreground)] mx-auto mb-4" />
            <p className="text-[color:var(--muted-foreground)]">
              No users found
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[color:var(--muted)/.1] border-b border-[color:var(--border)]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--muted-foreground)] uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--muted-foreground)] uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--muted-foreground)] uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--muted-foreground)] uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--muted-foreground)] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--muted-foreground)] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--border)]">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-[color:var(--muted)/.1]"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-[color:var(--card-foreground)]">
                        {user.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-[color:var(--muted-foreground)]">
                        {user.email}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                          user.role
                        )}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-[color:var(--card-foreground)]">
                        {user.branch.branchName}
                      </span>
                      <span className="text-xs text-[color:var(--muted-foreground)] ml-1">
                        ({user.branch.branchCode})
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.status === "ACTIVE"
                            ? "bg-[color:var(--success)/.1] text-[color:var(--success)]"
                            : "bg-[color:var(--destructive)/.1] text-[color:var(--destructive)]"
                        }`}
                      >
                        {user.status === "ACTIVE" ? (
                          <UserCheck className="w-3 h-3 mr-1" />
                        ) : (
                          <UserX className="w-3 h-3 mr-1" />
                        )}
                        {user.status}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-1 text-[color:var(--primary)] hover:bg-[color:var(--primary)/.1] rounded transition-colors"
                          title="Edit user"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-1 text-[color:var(--destructive)] hover:bg-[color:var(--destructive)/.1] rounded transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[color:var(--card)] rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[color:var(--card-foreground)]">
                  {editingUser ? "Edit User" : "Add New User"}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="p-1 hover:bg-[color:var(--muted)/.2] rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[color:var(--card-foreground)] mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-[color:var(--border)] rounded-lg focus:ring-2 focus:ring-[color:var(--accent)] bg-[color:var(--card)] text-[color:var(--card-foreground)]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[color:var(--card-foreground)] mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-[color:var(--border)] rounded-lg focus:ring-2 focus:ring-[color:var(--accent)] bg-[color:var(--card)] text-[color:var(--card-foreground)]"
                    required
                    disabled={!!editingUser}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[color:var(--card-foreground)] mb-2">
                    Password {!editingUser && "*"}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-[color:var(--border)] rounded-lg focus:ring-2 focus:ring-[color:var(--accent)] bg-[color:var(--card)] text-[color:var(--card-foreground)]"
                      required={!editingUser}
                      placeholder={
                        editingUser
                          ? "Leave blank to keep current password"
                          : ""
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-foreground)]"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[color:var(--card-foreground)] mb-2">
                    Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-[color:var(--border)] rounded-lg focus:ring-2 focus:ring-[color:var(--accent)] bg-[color:var(--card)] text-[color:var(--card-foreground)]"
                    required
                  >
                    <option value="STAFF">Staff</option>
                    <option value="BRANCH_ADMIN">Branch Admin</option>
                    <option value="MANAGER">Manager</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[color:var(--card-foreground)] mb-2">
                    Branch *
                  </label>
                  <select
                    value={formData.branchId}
                    onChange={(e) =>
                      setFormData({ ...formData, branchId: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-[color:var(--border)] rounded-lg focus:ring-2 focus:ring-[color:var(--accent)] bg-[color:var(--card)] text-[color:var(--card-foreground)]"
                    required
                  >
                    <option value="">Select Branch</option>
                    {branches.map((branch) => (
                      <option key={branch.branchId} value={branch.branchId}>
                        {branch.branchName} ({branch.branchCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 border border-[color:var(--border)] text-[color:var(--card-foreground)] rounded-lg hover:bg-[color:var(--muted)/.2]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-[color:var(--accent)] text-[color:var(--accent-foreground)] rounded-lg hover:bg-[color:var(--accent)/.9]"
                  >
                    {editingUser ? "Update User" : "Create User"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
