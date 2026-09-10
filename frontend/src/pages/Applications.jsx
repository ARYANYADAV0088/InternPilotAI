import { useEffect, useState } from "react";
import axios from "axios";
import { ClipboardCheck, ChevronDown } from "lucide-react";

const statuses = ["applied", "interview", "selected", "rejected"];

function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const fetchApplications = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/applications",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setApplications(response.data.applications || []);
    } catch (error) {
      console.error("Failed to fetch applications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const updateStatus = async (applicationId, status) => {
    try {
      await axios.put(
        `http://localhost:5000/api/applications/${applicationId}`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setApplications((current) =>
        current.map((application) =>
          application._id === applicationId
            ? { ...application, status }
            : application
        )
      );
    } catch (error) {
      console.error("Failed to update status:", error);
      alert(
        error.response?.data?.message ||
          "Unable to update application status."
      );
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">TRACKER</p>
          <h1>Applications</h1>
          <p>Track and manage your internship applications.</p>
        </div>
      </div>

      {loading ? (
        <div className="empty-card">Loading applications...</div>
      ) : applications.length === 0 ? (
        <div className="empty-card">
          <ClipboardCheck size={40} />
          <h3>No applications yet</h3>
          <p>Apply to an internship and it will appear here.</p>
        </div>
      ) : (
        <div className="application-list">
          {applications.map((application) => (
            <div className="application-card" key={application._id}>
              <div className="application-icon">
                <ClipboardCheck size={23} />
              </div>

              <div className="application-info">
                <h3>
                  {application.internshipId?.title ||
                    "Internship"}
                </h3>

                <p>
                  {application.internshipId?.company ||
                    "Company"}
                </p>

                <span className={`status ${application.status}`}>
                  {application.status}
                </span>
              </div>

              <div className="status-control">
                <ChevronDown size={15} />

                <select
                  value={application.status}
                  onChange={(e) =>
                    updateStatus(
                      application._id,
                      e.target.value
                    )
                  }
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() +
                        status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Applications;